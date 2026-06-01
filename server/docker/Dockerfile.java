FROM eclipse-temurin:21-jdk-alpine
WORKDIR /code
CMD ["sh", "-c", "javac Main.java && java Main"]