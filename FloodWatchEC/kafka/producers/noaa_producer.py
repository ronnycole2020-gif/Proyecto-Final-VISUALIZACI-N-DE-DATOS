from kafka import KafkaProducer
import json
import requests
import time
from datetime import datetime

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

LAT = -2.17
LON = -79.92

URL = (
    f"https://api.open-meteo.com/v1/forecast?"
    f"latitude={LAT}&longitude={LON}"
    "&current=temperature_2m,precipitation,wind_speed_10m"
)

print("Productor iniciado...")

while True:

    try:

        response = requests.get(URL, timeout=10)

        data = response.json()["current"]

        mensaje = {
            "timestamp": datetime.now().isoformat(),
            "temperatura": data["temperature_2m"],
            "precipitacion": data["precipitation"],
            "viento": data["wind_speed_10m"],
            "ciudad": "Guayaquil"
        }

        producer.send("sst-noaa", mensaje)

        print(mensaje)

    except Exception as e:
        print(e)

    time.sleep(60)