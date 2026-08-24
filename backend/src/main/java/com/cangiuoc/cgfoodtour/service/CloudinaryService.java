package com.cangiuoc.cgfoodtour.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder}")
    private String folderName;

    /**
     * Tải file lên Cloudinary vào folder chỉ định
     */
    public Map uploadImage(MultipartFile file) throws IOException
    {
        return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
            "folder", folderName,
            "resource_type", "image"
        ));
    }

    /**
     * Xóa file trên Cloudinary bằng Public ID
     */
    public Map deleteImage(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
