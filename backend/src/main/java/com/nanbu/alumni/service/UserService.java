package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.UserDto;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto updateUser(Long id, User userUpdate) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (userUpdate.getName() != null) user.setName(userUpdate.getName());
        if (userUpdate.getSchool() != null) user.setSchool(userUpdate.getSchool());
        if (userUpdate.getLevel() != null) user.setLevel(userUpdate.getLevel());
        if (userUpdate.getYear() != null) user.setYear(userUpdate.getYear());
        if (userUpdate.getClassname() != null) user.setClassname(userUpdate.getClassname());
        if (userUpdate.getJob() != null) user.setJob(userUpdate.getJob());
        if (userUpdate.getCity() != null) user.setCity(userUpdate.getCity());
        if (userUpdate.getBio() != null) user.setBio(userUpdate.getBio());
        if (userUpdate.getAvatar() != null) user.setAvatar(userUpdate.getAvatar());
        if (userUpdate.getRole() != null) user.setRole(userUpdate.getRole());
        if (userUpdate.getPassword() != null && !userUpdate.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }
        
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if ("admin".equals(user.getUsername())) {
            throw new RuntimeException("不能删除管理员账号");
        }
        userRepository.deleteById(id);
    }

    // 检查用户是否有权限管理某校友
    public boolean canManageAlumni(User user, com.nanbu.alumni.entity.Alumni alumni) {
        if (user.isSuperAdmin()) return true;
        if (user.isSchoolAdmin()) {
            return alumni.getSchool() != null && alumni.getSchool().equals(user.getSchool());
        }
        if (user.isGradeAdmin()) {
            return alumni.getSchool() != null && alumni.getSchool().equals(user.getSchool())
                    && alumni.getLevel() != null && alumni.getLevel().equals(user.getLevel())
                    && alumni.getYear() != null && alumni.getYear().equals(user.getYear());
        }
        if (user.isClassAdmin()) {
            return alumni.getSchool() != null && alumni.getSchool().equals(user.getSchool())
                    && alumni.getLevel() != null && alumni.getLevel().equals(user.getLevel())
                    && alumni.getYear() != null && alumni.getYear().equals(user.getYear())
                    && alumni.getClassname() != null && alumni.getClassname().equals(user.getClassname());
        }
        return false;
    }
}
