package com.nhatlam.redditnews.mapper;

/**
 * Article mapping is now done directly in ArticleService to handle the
 * Many-to-Many relationships (categories, tags) and nested DTOs (AuthorDTO,
 * CategoryDTO, ViewStatsDTO) that MapStruct cannot easily handle.
 *
 * <p>
 * This class is kept as a placeholder so that any future MapStruct usage can be
 * added here without breaking the package structure.
 */
public class ArticleMapper {
    // intentionally empty — mapping logic lives in ArticleService#toDTO
}
