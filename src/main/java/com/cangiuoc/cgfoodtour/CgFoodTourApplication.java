package com.cangiuoc.cgfoodtour;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class CgFoodTourApplication {

	public static void main(String[] args) {
		SpringApplication.run(CgFoodTourApplication.class, args);
	}

}
