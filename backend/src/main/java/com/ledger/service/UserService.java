package com.ledger.service;

import com.ledger.model.User;
import com.ledger.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void seedUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User(null, "admin",   passwordEncoder.encode("admin123"),  User.Role.ADMIN));
            userRepository.save(new User(null, "auditor", passwordEncoder.encode("audit123"),  User.Role.AUDITOR));
            userRepository.save(new User(null, "user1",   passwordEncoder.encode("user123"),   User.Role.USER));
            userRepository.save(new User(null, "viewer",  passwordEncoder.encode("view123"),   User.Role.VIEWER));
        }
    }

    public User login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }

    public User createUser(String username, String password, User.Role role) {
        if (userRepository.findByUsername(username).isPresent())
            throw new RuntimeException("Username already exists");
        return userRepository.save(new User(null, username, passwordEncoder.encode(password), role));
    }

    public List<User> getAllUsers() { return userRepository.findAll(); }

    public User updateRole(String id, User.Role role) {
        User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        u.setRole(role);
        return userRepository.save(u);
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) throw new RuntimeException("User not found");
        userRepository.deleteById(id);
    }
}
