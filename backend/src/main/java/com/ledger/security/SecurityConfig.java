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
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

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
            // Disable the default restrictive security headers that block fonts/scripts
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.disable())
                .frameOptions(frame -> frame.disable())
                .contentTypeOptions(ct -> ct.disable())
            )
            .authorizeHttpRequests(auth -> auth
                // Static frontend assets — always public
                .requestMatchers(
                    "/", "/index.html", "/favicon.svg", "/favicon.ico",
                    "/assets/**", "/*.js", "/*.css", "/*.svg",
                    "/*.png", "/*.woff", "/*.woff2", "/*.ico"
                ).permitAll()
                // Public auth endpoints
                .requestMatchers("/api/auth/login", "/api/auth/signup").permitAll()
                // Blockchain read — all authenticated roles
                .requestMatchers(HttpMethod.GET, "/api/blockchain/**")
                    .hasAnyRole("VIEWER", "USER", "AUDITOR", "ADMIN")
                // Blockchain detect — all authenticated roles
                .requestMatchers(HttpMethod.POST, "/api/blockchain/detect")
                    .hasAnyRole("VIEWER", "USER", "AUDITOR", "ADMIN")
                // Blockchain add transaction
                .requestMatchers(HttpMethod.POST, "/api/blockchain/transaction")
                    .hasAnyRole("USER", "AUDITOR", "ADMIN")
                // Blockchain tamper + reset — admin only
                .requestMatchers(HttpMethod.POST, "/api/blockchain/tamper", "/api/blockchain/reset")
                    .hasRole("ADMIN")
                // User management — admin only
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
