FROM gcc:13-bookworm
WORKDIR /code
CMD ["sh", "-c", "gcc -o solution solution.c && ./solution"]