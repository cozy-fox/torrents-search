# Multi-stage build for Jackett
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for dependency restoration
COPY ["src/Jackett.Server/Jackett.Server.csproj", "src/Jackett.Server/"]
COPY ["src/Jackett.Common/Jackett.Common.csproj", "src/Jackett.Common/"]
COPY ["src/DateTimeRoutines/DateTimeRoutines.csproj", "src/DateTimeRoutines/"]
COPY ["src/Directory.Build.props", "src/"]

# Restore dependencies
RUN dotnet restore "src/Jackett.Server/Jackett.Server.csproj"

# Copy all source code
COPY . .

# Build and publish the application
WORKDIR "/src/src/Jackett.Server"
RUN dotnet publish "Jackett.Server.csproj" -c Release -o /app/publish -f net9.0 --self-contained false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create non-root user for security
RUN groupadd -r jackett && useradd -r -g jackett -m jackett

# Create necessary directories
RUN mkdir -p /app/config /app/downloads && \
    chown -R jackett:jackett /app

# Copy published application
COPY --from=build /app/publish .

# Set ownership
RUN chown -R jackett:jackett /app

# Switch to non-root user
USER jackett

# Expose port
EXPOSE 9117

# Set environment variables
ENV ASPNETCORE_URLS=http://+:9117
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9117/ || exit 1

# Run Jackett
ENTRYPOINT ["dotnet", "jackett.dll"]
