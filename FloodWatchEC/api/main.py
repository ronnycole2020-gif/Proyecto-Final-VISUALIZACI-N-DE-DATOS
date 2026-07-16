from fastapi import FastAPI
from pyspark.sql import SparkSession
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="FloodWatchEC API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

spark = (
    SparkSession.builder
    .appName("FloodWatchAPI")
    .master("local[*]")
    .getOrCreate()
)

HDFS_PATH = "hdfs://localhost:9000/FloodWatchEC/processed"


@app.get("/")
def home():
    return {
        "mensaje": "FloodWatchEC API funcionando"
    }


@app.get("/datos")
def obtener_datos():

    df = spark.read.parquet(HDFS_PATH)

    datos = [
        row.asDict()
        for row in df.orderBy("timestamp", ascending=False).limit(20).collect()
    ]

    return datos

@app.get("/ultimo")
def obtener_ultimo():

    df = spark.read.parquet(HDFS_PATH)

    ultimo = (
        df.orderBy("timestamp", ascending=False)
        .limit(1)
        .collect()
    )

    if not ultimo:
        return {"mensaje": "No hay datos"}

    dato = ultimo[0].asDict()

    # Índice de riesgo simple (0-100)
    indice = 0

    indice += min(dato.get("temperatura", 0), 40)

    indice += min(dato.get("precipitacion", 0), 30)

    indice += min(dato.get("nivel_marea", 0) * 5, 15)

    indice += min(dato.get("nivel_embalse", 0) / 10, 15)

    dato["indice_riesgo"] = round(indice, 1)

    return dato


@app.get("/estadisticas")
def estadisticas():

    df = spark.read.parquet(HDFS_PATH)

    return {
        "temperatura_promedio": round(
            df.agg({"temperatura": "avg"}).collect()[0][0], 2
        ),
        "temperatura_maxima": df.agg({"temperatura": "max"}).collect()[0][0],
        "temperatura_minima": df.agg({"temperatura": "min"}).collect()[0][0],
        "viento_promedio": round(
            df.agg({"viento": "avg"}).collect()[0][0], 2
        )
    }

@app.get("/ciudades")
def ciudades():

    return [

        {
            "nombre":"Guayaquil",
            "lat":-2.170998,
            "lon":-79.922359
        },

        {
            "nombre":"Quito",
            "lat":-0.180653,
            "lon":-78.467834
        },

        {
            "nombre":"Cuenca",
            "lat":-2.900129,
            "lon":-79.005896
        },

        {
            "nombre":"Manta",
            "lat":-0.967653,
            "lon":-80.708910
        },

        {
            "nombre":"Esmeraldas",
            "lat":0.959200,
            "lon":-79.653900
        }

    ]