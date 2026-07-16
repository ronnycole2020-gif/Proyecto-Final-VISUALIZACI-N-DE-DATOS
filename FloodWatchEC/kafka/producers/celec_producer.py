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
        "nivel_embalse": round(random.uniform(40,100),2),
        "embalse":"Daule-Peripa"
    }

    producer.send("embalse-celec", dato)

    print(dato)

    time.sleep(5)