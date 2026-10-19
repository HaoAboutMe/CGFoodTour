package com.cangiuoc.cgfoodtour.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.profiles.active=test")
@AutoConfigureMockMvc
class OperationalEndpointsTest {
    @Autowired
    MockMvc mockMvc;

    @Test
    void readinessIsPublicMinimalAndCorrelated() throws Exception {
        mockMvc.perform(get("/api/actuator/health/readiness")
                        .contextPath("/api")
                        .header(RequestCorrelationFilter.HEADER_NAME, "health-test-123"))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestCorrelationFilter.HEADER_NAME, "health-test-123"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void prometheusRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/actuator/prometheus").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }
}
