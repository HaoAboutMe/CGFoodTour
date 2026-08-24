package com.cangiuoc.cgfoodtour.mapper;

import com.cangiuoc.cgfoodtour.dto.request.CategoryRequest;
import com.cangiuoc.cgfoodtour.dto.response.CategoryResponse;
import com.cangiuoc.cgfoodtour.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CategoryMapper {
    Category toCategory(CategoryRequest request);
    CategoryResponse toCategoryResponse(Category category);
    List<CategoryResponse> toCategoryResponseList(List<Category> categories);
    void updateCategory(@MappingTarget Category category, CategoryRequest request);
}
