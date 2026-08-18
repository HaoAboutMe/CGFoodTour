package com.j2ee.buildpcchecker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class BuildPcCheckerApplication {

	public static void main(String[] args) {
		SpringApplication.run(BuildPcCheckerApplication.class, args);
	}

}
