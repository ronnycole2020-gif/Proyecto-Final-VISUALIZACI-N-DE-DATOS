from kafka import KafkaProducer
import json
import time
import random
from datetime import datetime

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

while True:

    dato = {
        "timestamp": datetime.now().isoformat(),
        "nivel_marea": round(random.uniform(1.5, 4.5), 2),
        "ciudad": "Guayaquil"
    }

    producer.send("mareas-inocar", dato)

    print(dato)

    time.sleep(5)