package com.ledger.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward SPA routes to index.html, but NOT static asset paths
        registry.addViewController("/{path:^(?!assets|favicon|icons)[^\\.]*}").setViewName("forward:/index.html");
        registry.addViewController("/{path:^(?!assets|favicon|icons)[^\\.]*}/**").setViewName("forward:/index.html");
    }
}
