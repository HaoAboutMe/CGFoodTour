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

    public Map uploadImage(MultipartFile file) throws IOException
    {
        return uploadImage(file, null);
    }

    /**
     * Tải file lên Cloudinary vào folder chỉ định và subfolder tùy chọn
     */
    public Map uploadImage(MultipartFile file, String subFolder) throws IOException
    {
        String targetFolder = folderName;
        if (subFolder != null && !subFolder.trim().isEmpty()) {
            String targetSub = subFolder.trim();
            int index = folderName.lastIndexOf("/avatars");
            if (index != -1) {
                String rootFolder = folderName.substring(0, index);
                targetFolder = rootFolder + "/" + targetSub;
            } else {
                targetFolder = folderName + "/" + targetSub;
            }
        }
        return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
            "folder", targetFolder,
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
