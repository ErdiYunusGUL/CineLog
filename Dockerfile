FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Proje dosyalarını kopyala ve bağımlılıkları yükle
COPY ["CineLog.API/CineLog.API.csproj", "CineLog.API/"]
COPY ["CineLog.Business/CineLog.Business.csproj", "CineLog.Business/"]
COPY ["CineLog.DataAccess/CineLog.DataAccess.csproj", "CineLog.DataAccess/"]
COPY ["CineLog.Entity/CineLog.Entity.csproj", "CineLog.Entity/"]
RUN dotnet restore "CineLog.API/CineLog.API.csproj"

# Tüm kodları kopyala ve derle
COPY . .
WORKDIR "/src/CineLog.API"
RUN dotnet build "CineLog.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CineLog.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render'ın port yönlendirmeleri için varsayılan HTTP portunu 8080 yap
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "CineLog.API.dll"]
