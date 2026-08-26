package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.service.CloudinaryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/upload")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UploadController {
    CloudinaryService cloudinaryService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) {
        try {
            if (file.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_FILE);
            }
            // Optional: check file type, size, etc.
            Map uploadResult = cloudinaryService.uploadImage(file, folder);
            String url = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            result.put("publicId", publicId);

            return ApiResponse.<Map<String, String>>builder()
                    .result(result)
                    .message("Image uploaded successfully")
                    .build();
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }
}
