from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("ReadParquet")
    .master("local[*]")
    .getOrCreate()
)

df = spark.read.parquet(
    "hdfs://localhost:9000/FloodWatchEC/processed"
)

df.show(truncate=False)

spark.stop()