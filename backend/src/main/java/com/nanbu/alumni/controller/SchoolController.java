package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.SchoolDto;
import com.nanbu.alumni.service.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schools")
public class SchoolController {

    @Autowired
    private SchoolService schoolService;

    @GetMapping
    public ApiResponse<List<SchoolDto>> getAllSchools() {
        return ApiResponse.success(schoolService.getAllSchools());
    }

    @GetMapping("/{id}")
    public ApiResponse<SchoolDto> getSchoolById(@PathVariable Long id) {
        return ApiResponse.success(schoolService.getSchoolById(id));
    }

    @GetMapping("/by-name/{name}")
    public ApiResponse<SchoolDto> getSchoolByName(@PathVariable String name) {
        return ApiResponse.success(schoolService.getSchoolByName(name));
    }
}
