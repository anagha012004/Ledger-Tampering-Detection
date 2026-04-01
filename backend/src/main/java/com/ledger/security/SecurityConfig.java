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
                // Static assets
                .requestMatchers("/", "/index.html", "/favicon.ico",
                    "/assets/**", "/static/**", "/*.js", "/*.css", "/*.svg", "/*.png").permitAll()
                // Public auth
                .requestMatchers("/api/auth/login", "/api/auth/signup").permitAll()
                // Blockchain — all authenticated roles can read
                .requestMatchers(HttpMethod.GET, "/api/blockchain/**")
                    .hasAnyRole("VIEWER", "USER", "AUDITOR", "ADMIN")
                // Blockchain write — add transaction
                .requestMatchers(HttpMethod.POST, "/api/blockchain/transaction")
                    .hasAnyRole("USER", "AUDITOR", "ADMIN")
                // Blockchain detect
                .requestMatchers(HttpMethod.POST, "/api/blockchain/detect")
                    .hasAnyRole("VIEWER", "USER", "AUDITOR", "ADMIN")
                // Blockchain tamper + reset — admin only
                .requestMatchers(HttpMethod.POST, "/api/blockchain/tamper", "/api/blockchain/reset")
                    .hasRole("ADMIN")
                // User management — admin only
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .headers(h -> h.frameOptions(f -> f.disable()))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
