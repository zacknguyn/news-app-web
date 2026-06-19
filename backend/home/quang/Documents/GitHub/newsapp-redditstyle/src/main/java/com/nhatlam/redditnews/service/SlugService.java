package com.nhatlam.redditnews.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Generates SEO-friendly URL slugs from Vietnamese or English text. Example:
 * "Khám phá Sơn Đoòng" -> "kham-pha-son-doong"
 */
@Service
@RequiredArgsConstructor
public class SlugService {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private static final Pattern MULTI_HYPHENS = Pattern.compile("-{2,}");

    public String toSlug(String input) {
        if (input == null || input.isBlank())
            return "";

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "") // strip diacritics
                .toLowerCase(Locale.ROOT).replaceAll("đ", "d") // Vietnamese đ (post-NFD still keeps đ as đ)
                .replaceAll("Đ", "d");

        // Re-normalize after ASCII replacement
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD).replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        slug = WHITESPACE.matcher(slug).replaceAll("-");
        slug = NON_LATIN.matcher(slug).replaceAll("");
        slug = MULTI_HYPHENS.matcher(slug).replaceAll("-");
        slug = slug.replaceAll("^-|-$", ""); // trim leading/trailing hyphens

        return slug;
    }
}
