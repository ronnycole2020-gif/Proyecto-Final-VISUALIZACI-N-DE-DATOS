from kafka import KafkaProducer
import json
import time
import random
from datetime import datetime

niveles = [
    "SIN ALERTA",
    "AMARILLA",
    "NARANJA",
    "ROJA"
]

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

while True:

    dato = {
        "timestamp": datetime.now().isoformat(),
        "alerta": random.choice(niveles),
        "ciudad":"Guayaquil"
    }

    producer.send("alertas-sngr", dato)

    print(dato)

    time.sleep(5)