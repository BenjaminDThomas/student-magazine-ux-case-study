FROM nginx:alpine
COPY student_magazine /usr/share/nginx/html
EXPOSE 80
