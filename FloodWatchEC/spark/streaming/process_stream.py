from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    from_json,
    when,
    lit
)
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    DoubleType
)


# Crear sesión de Spark
spark = (
    SparkSession.builder
    .appName("FloodWatchEC")
    .master("local[*]")
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")

# Esquema del JSON recibido
schema = StructType([
    StructField("timestamp", StringType(), True),
    StructField("temperatura", DoubleType(), True),
    StructField("precipitacion", DoubleType(), True),
    StructField("viento", DoubleType(), True),
    StructField("ciudad", StringType(), True)
])

# Leer Kafka
df = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "localhost:9092")
    .option("subscribe", "sst-noaa")
    .option("startingOffsets", "latest")
    .option("failOnDataLoss", "false")
    .load()
)

# Convertir value a String
json_df = df.selectExpr("CAST(value AS STRING) as json")

# ===============================
# NOAA
# ===============================
datos = (
    json_df
    .select(from_json(col("json"), schema).alias("data"))
    .select("data.*")
)
# ===============================
# Simular otras fuentes
# ===============================

datos = (
    datos
    .withColumn("nivel_marea", lit(3.8))
    .withColumn("nivel_embalse", lit(90.0))
    .withColumn("alerta", lit("AMARILLA"))
)
# ===============================
# Calcular riesgo NOAA
# ===============================
datos = datos.withColumn(

    "riesgo",

    when(

        (col("temperatura") >= 30) &
        (col("precipitacion") >= 20) &
        (col("nivel_marea") >= 3.5) &
        (col("nivel_embalse") >= 85),

        "CRITICO"

    ).when(

        (col("temperatura") >= 30) &
        (col("precipitacion") >= 10),

        "ALTO"

    ).when(

        (col("temperatura") >= 28) |
        (col("nivel_marea") >= 3.0),

        "MEDIO"

    ).otherwise(

        "BAJO"

    )

)

# Mostrar en consola
console_query = (
    datos.writeStream
    .format("console")
    .outputMode("append")
    .option("truncate", False)
    .option(
        "checkpointLocation",
        "hdfs://localhost:9000/FloodWatchEC/checkpoints_console_V2"
    )
    .start()
)

# Guardar en HDFS en formato Parquet
parquet_query = (
    datos.writeStream
    .format("parquet")
    .outputMode("append")
    .option("path", "hdfs://localhost:9000/FloodWatchEC/processed")
    .option(
        "checkpointLocation",
        "hdfs://localhost:9000/FloodWatchEC/checkpoints"
    )
    .start()
)

spark.streams.awaitAnyTermination()