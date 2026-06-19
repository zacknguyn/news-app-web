package com.nhatlam.redditnews.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileCustomizationUpdateDTO {
    private String profileHeadline;
    private String profileBio;
    private String profileAccent;
    private List<String> profileTags;
    private String selectedBadge;
}
