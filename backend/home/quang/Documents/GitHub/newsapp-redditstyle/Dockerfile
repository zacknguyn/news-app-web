#1 build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

#delete the old target file if exists and copy src, pom.xml into
COPY pom.xml .
COPY src ./src

#run build cmd to generate .jar file, skip the test phase
RUN mvn clean package -DskipTests

#2 create a lightweight image for running the app
FROM eclipse-temurin:21-jre
WORKDIR /app

#copy file .jar from stage 1 to stage 2
COPY --from=build /app/target/*.jar app.jar

#cmd to start app
ENTRYPOINT ["java", "-jar", "app.jar"]
