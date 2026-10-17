package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManagedImageServiceTest {
    @Mock CloudinaryService cloudinaryService;
    @Mock MediaCleanupQueueService cleanupQueueService;
    @InjectMocks ManagedImageService managedImageService;

    @Test
    void uploadValidatesDecodedImageBeforeCloudinaryUpload() throws IOException {
        var fakeImage = new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());

        assertThatThrownBy(() -> managedImageService.upload(fakeImage, "stores", 2 * 1024 * 1024))
                .isInstanceOf(AppException.class)
                .satisfies(exception -> assertThat(((AppException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_FILE));
        verify(cloudinaryService, never()).uploadImage(fakeImage, "stores");
    }

    @Test
    void uploadReturnsManagedUrlAndPublicIdForValidImage() throws IOException {
        byte[] png = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
        var image = new MockMultipartFile("file", "pixel.png", "image/png", png);
        when(cloudinaryService.uploadImage(image, "avatars"))
                .thenReturn(Map.of("secure_url", "https://cdn.example/pixel.png", "public_id", "avatars/pixel"));

        var result = managedImageService.upload(image, "avatars", 2 * 1024 * 1024);

        assertThat(result.url()).isEqualTo("https://cdn.example/pixel.png");
        assertThat(result.publicId()).isEqualTo("avatars/pixel");
    }

    @Test
    void failedCloudinaryDeleteIsPersistedForRetry() throws IOException {
        IOException failure = new IOException("temporary outage");
        when(cloudinaryService.deleteImage("stores/banner")).thenThrow(failure);

        managedImageService.deleteBestEffort("stores/banner");

        verify(cleanupQueueService).enqueue("stores/banner", failure);
    }
}
