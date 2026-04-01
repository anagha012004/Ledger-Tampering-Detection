package com.ledger.controller;

import com.ledger.model.User;
import com.ledger.service.UserService;
import com.ledger.security.JwtUtil;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                   RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuthController {

    private final UserService userService;
    private final JwtUtil     jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil     = jwtUtil;
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        User user  = userService.login(body.get("username"), body.get("password"));
        String tok = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return Map.of("token", tok, "username", user.getUsername(), "role", user.getRole().name());
    }

    @PostMapping("/auth/signup")
    public Map<String, Object> signup(@RequestBody Map<String, String> body) {
        User user  = userService.createUser(body.get("username"), body.get("password"), User.Role.USER);
        String tok = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return Map.of("token", tok, "username", user.getUsername(), "role", user.getRole().name());
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {
        return userService.getAllUsers().stream().map(u ->
            Map.<String, Object>of("id", u.getId(), "username", u.getUsername(), "role", u.getRole().name())
        ).toList();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, String> body) {
        User u = userService.createUser(body.get("username"), body.get("password"),
                User.Role.valueOf(body.get("role")));
        return Map.of("id", u.getId(), "username", u.getUsername(), "role", u.getRole().name());
    }

    @PutMapping("/users/{id}/role")
    public Map<String, Object> updateRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        User u = userService.updateRole(id, User.Role.valueOf(body.get("role")));
        return Map.of("id", u.getId(), "username", u.getUsername(), "role", u.getRole().name());
    }

    @DeleteMapping("/users/{id}")
    public Map<String, String> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return Map.of("message", "User deleted");
    }
}
