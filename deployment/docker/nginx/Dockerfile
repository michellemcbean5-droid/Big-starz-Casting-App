FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for uploads and SSL
RUN mkdir -p /var/www/uploads /etc/nginx/ssl

# Set proper permissions
RUN chown -R nginx:nginx /var/www/uploads /var/cache/nginx /var/log/nginx

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
