package io.github.jtsato.walletservice.configuration.web;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class RestFilterWebConfiguration implements WebMvcConfigurer {
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new Converter<String, List<String>>() {
            @Override
            public List<String> convert(String source) {
                return List.of(source);
            }
        });
    }
}
