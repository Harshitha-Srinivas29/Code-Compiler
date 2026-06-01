FROM gcc:13-bookworm
WORKDIR /code
CMD ["sh", "-c", "g++ -o solution solution.cpp && ./solution"]