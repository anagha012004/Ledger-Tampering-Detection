package com.ledger.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) { this.jwtFilter = jwtFilter; }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Static assets (Vite build output + SPA fallback)
                .requestMatchers(
                    "/", "/index.html", "/favicon.ico",
                    "/assets/**", "/static/**",
                    "/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg", "/*.json"
                ).permitAll()

                // Public API endpoints
                .requestMatchers("/api/auth/login", "/api/auth/signup").permitAll()

                // WebSocket + H2 console
                .requestMatchers("/ws/**", "/h2-console/**").permitAll()

                // Viewer: read-only
                .requestMatchers(HttpMethod.GET,
                    "/api/nodes/**", "/api/integrity",
                    "/api/alerts/**", "/api/audit/**"
                ).hasAnyRole("VIEWER", "USER", "AUDITOR", "ADMIN")

                // User: add transactions
                .requestMatchers(HttpMethod.POST, "/api/transaction")
                    .hasAnyRole("USER", "AUDITOR", "ADMIN")

                // Auditor: detect + forensics + reports
                .requestMatchers(HttpMethod.GET,
                    "/api/detect", "/api/forensics/**",
                    "/api/report/**", "/api/snapshots/**",
                    "/api/security/publickey"
                ).hasAnyRole("AUDITOR", "ADMIN")

                // Admin only
                .requestMatchers(
                    "/api/tamper", "/api/reset", "/api/users/**",
                    "/api/transaction/update", "/api/snapshots/create"
                ).hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .headers(h -> h.frameOptions(f -> f.disable()))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
