package com.cangiuoc.cgfoodtour.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreServiceUrlParserTest {
    @Mock
    GoogleMapsUrlResolver googleMapsUrlResolver;

    @InjectMocks
    StoreService storeService;

    @Test
    void parsesCoordinatesWithoutFollowingShortLinks() {
        assertThat(storeService.parseGoogleMapsUrl("https://www.google.com/maps/@10.51234,106.65432,17z"))
                .containsEntry("latitude", "10.51234")
                .containsEntry("longitude", "106.65432");

        when(googleMapsUrlResolver.resolve("http://127.0.0.1:8080/admin")).thenReturn(List.of());
        assertThat(storeService.parseGoogleMapsUrl("http://127.0.0.1:8080/admin")).isEmpty();
    }

    @Test
    void extractsCoordinatesFromSafelyResolvedShortLink() {
        String shortLink = "https://maps.app.goo.gl/oW3cwtzLXYQXrYLN8";
        when(googleMapsUrlResolver.resolve(shortLink)).thenReturn(List.of(
                "https://www.google.com/maps/place/example/@10.602913,106.656247,64m/"
                        + "data=!3d10.6031282!4d106.6565301"));

        assertThat(storeService.parseGoogleMapsUrl(shortLink))
                .containsEntry("latitude", "10.6031282")
                .containsEntry("longitude", "106.6565301");
    }

    @Test
    void rejectsOversizedOrControlCharacterInput() {
        assertThat(storeService.parseGoogleMapsUrl("x".repeat(2049))).isEmpty();
        assertThat(storeService.parseGoogleMapsUrl("10.1,106.2\nhttp://localhost")).isEmpty();
    }
}
