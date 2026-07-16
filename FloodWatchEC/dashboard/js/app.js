// ===============================
// Actualizar tarjetas principales
// ===============================

async function cargarDatos() {

    try {

        const respuesta = await fetch("http://localhost:8000/ultimo");

        const datos = await respuesta.json();

        document.getElementById("temperatura").textContent =
            datos.temperatura + " °C";

        document.getElementById("viento").textContent =
            datos.viento + " km/h";

        document.getElementById("precipitacion").textContent =
            datos.precipitacion + " mm";

        document.getElementById("riesgo").textContent =
            datos.riesgo;

        document.getElementById("marea").textContent =
            datos.nivel_marea + " m";

        document.getElementById("embalse").textContent =
            datos.nivel_embalse + " %";

        document.getElementById("alerta").textContent =
            datos.alerta;

        document.getElementById("indice").textContent =
            datos.indice_riesgo + " /100";

        document.getElementById("hora").textContent =
            new Date(datos.timestamp).toLocaleString();

        // ===============================
        // Cambiar color de la tarjeta
        // ===============================
        const alerta = document.getElementById("alerta");

        if(datos.alerta === "AMARILLA"){

            alerta.style.color="#FFC107";

        }

        else if(datos.alerta==="NARANJA"){

            alerta.style.color="#FF9800";

        }

        else if(datos.alerta==="ROJA"){

            alerta.style.color="#D32F2F";

        }

        else{

            alerta.style.color="#4CAF50";

        }

        const tarjeta = document.getElementById("card-riesgo");

        if (datos.riesgo === "BAJO") {

            tarjeta.style.background = "#c8f7c5";
            tarjeta.style.color = "#0b5d1e";

        }
        else if (datos.riesgo === "MEDIO") {

            tarjeta.style.background = "#ffe08a";
            tarjeta.style.color = "#8a5a00";

        }
        else {

            tarjeta.style.background = "#ffb3b3";
            tarjeta.style.color = "#8b0000";

        }

    } catch (error) {

        console.error("Error:", error);

    }

}

// ===============================
// Gráfico de temperatura
// ===============================

let grafico;

async function cargarGrafico() {

    const respuesta = await fetch("http://localhost:8000/datos");

    const datos = await respuesta.json();

    const temperaturas = datos
        .map(d => d.temperatura)
        .reverse();

    const horas = datos
        .map(d => d.timestamp.substring(11, 19))
        .reverse();

    if (grafico) {

        grafico.destroy();

    }

    grafico = new Chart(
    document.getElementById("graficoTemperatura"),
    {
        type: "line",

        data: {
            labels: horas,

            datasets: [
                {
                    label: "Temperatura (°C)",
                    data: temperaturas,
                    borderColor: "#1976d2",
                    backgroundColor: "rgba(25,118,210,.15)",
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 3,
                    tension: 0.4
                },
                {
                    label: "Precipitación (mm)",
                    data: datos
                        .map(d => d.precipitacion)
                        .reverse(),
                    borderColor: "#00ACC1",
                    backgroundColor: "rgba(0,172,193,.15)",
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 3,
                    tension: 0.4
                }
            ]
        },

        options: {
            responsive: true,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "top"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Hora"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Valores climáticos"
                    }
                }
            }
        }
    }
);
}

// ===============================
// Historial de alertas
// ===============================

async function cargarHistorial() {

    const respuesta = await fetch("http://localhost:8000/datos");

    const datos = await respuesta.json();

    const cuerpo = document.querySelector("#tablaAlertas tbody");

    cuerpo.innerHTML = "";

    datos.forEach(d => {

    let color = "#c8f7c5";

    if (d.riesgo === "MEDIO") {

        color = "#ffe08a";

    }

    if (d.riesgo === "ALTO") {

        color = "#ffb3b3";

    }

    cuerpo.innerHTML += `

    <tr style="background:${color}">

        <td>${d.timestamp.substring(11,19)}</td>

        <td>${d.temperatura} °C</td>

        <td><b>${d.riesgo}</b></td>

    </tr>

    `;

});

}

// ===============================
// Inicializar mapa
// ===============================

const mapa = L.map("mapa").setView([-2.170998, -79.922359], 8);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
).addTo(mapa);

// ===============================
// Capas del mapa
// ===============================
const capaCiudades = L.layerGroup().addTo(mapa);
const capaZonas = L.layerGroup().addTo(mapa);
const capaLluvia = L.layerGroup().addTo(mapa);
const capaMarea = L.layerGroup().addTo(mapa);
const capaInundacion = L.layerGroup().addTo(mapa);
const capaEvacuacion = L.layerGroup().addTo(mapa);

// ===============================
// Control de capas
// ===============================

L.control.layers(
    {},
    {
        "Ciudades": capaCiudades,
        "Zonas de riesgo": capaZonas,
        "Precipitación": capaLluvia,
        "Marea": capaMarea,
        "Escenario Inundacion":capaInundacion,
        "Ruta de evacuación": capaEvacuacion
    }
).addTo(mapa);

const leyenda = L.control({ position: "bottomright" });

leyenda.onAdd = function () {

    const div = L.DomUtil.create("div", "leyenda-riesgo");

    div.innerHTML = `
        <strong>Nivel de riesgo</strong><br>
        <span class="punto bajo"></span> Bajo<br>
        <span class="punto medio"></span> Medio<br>
        <span class="punto alto"></span> Alto<br>
        <span class="punto critico"></span> Crítico
    `;

    return div;
};

leyenda.addTo(mapa);

// ===============================
// Marcadores de ciudades
// ===============================

let marcadoresCiudades = [];

async function cargarCiudades() {

    // Solo crear los marcadores una vez
    if (marcadoresCiudades.length > 0) {
        return;
    }

    const respuestaCiudades = await fetch("http://localhost:8000/ciudades");
    const ciudades = await respuestaCiudades.json();

    const respuestaDatos = await fetch("http://localhost:8000/ultimo");
    const datos = await respuestaDatos.json();

    let color = "green";

    if (datos.riesgo === "MEDIO") {
        color = "orange";
    }

    if (datos.riesgo === "ALTO") {
        color = "red";
    }

    ciudades.forEach(ciudad => {

        const icono = L.divIcon({
            html: `
                <div style="
                    background:${color};
                    width:18px;
                    height:18px;
                    border-radius:50%;
                    border:2px solid white;
                "></div>
            `,
            className: ""
        });

        const marker = L.marker(
            [ciudad.lat, ciudad.lon],
            { icon: icono }
        ).addTo(capaCiudades);

        marker.bindPopup(`
            <b>${ciudad.nombre}</b><br>
            🌡 ${datos.temperatura} °C<br>
            💨 ${datos.viento} km/h<br>
            🌧 ${datos.precipitacion} mm<br>
            ⚠ Riesgo: ${datos.riesgo}
        `);

        marcadoresCiudades.push(marker);

    });

}

// ===============================
// Zonas de riesgo
// ===============================

const zonas = [

{
    nombre: "Urdesa",
    riesgo: "BAJO",

    coordenadas: [
        [-2.170,-79.920],
        [-2.168,-79.914],
        [-2.173,-79.911],
        [-2.176,-79.918]
    ]
},

{
    nombre: "Sauces",
    riesgo: "MEDIO",

    coordenadas: [
        [-2.120,-79.900],
        [-2.116,-79.892],
        [-2.122,-79.887],
        [-2.126,-79.896]
    ]
},

{
    nombre: "Centro",
    riesgo: "ALTO",

    coordenadas: [
        [-2.190,-79.890],
        [-2.184,-79.883],
        [-2.189,-79.876],
        [-2.195,-79.883]
    ]
},

{
    nombre: "Isla Trinitaria",
    riesgo: "ALTO",

    coordenadas: [
        [-2.235,-79.910],
        [-2.228,-79.900],
        [-2.236,-79.892],
        [-2.243,-79.904]
    ]
}

];

// ===============================
// Dibujar zonas
// ===============================

let zonasDibujadas = false;

function dibujarZonas() {

    if (zonasDibujadas) {
        return;
    }

    zonasDibujadas = true;

    zonas.forEach(zona => {

        let color = "#4CAF50";

        if (zona.riesgo === "MEDIO") {
            color = "#FFC107";
        }

        if (zona.riesgo === "ALTO") {
            color = "#F44336";
        }

        L.polygon(
            zona.coordenadas,
            {
                color: color,
                fillColor: color,
                fillOpacity: 0.45
            }
        )
        .bindPopup(`
    <b>${zona.nombre}</b><br>

    🌡 Temperatura: 30.9 °C<br>

    🌧 Precipitación: 0 mm<br>

    🌊 Marea: 3.8 m<br>

    🏞 Embalse: 90 %<br>

    🚨 Alerta: AMARILLA<br>

    ⚠ Riesgo: ${zona.riesgo}
`);

    });

}

// ===============================
// Dibujar precipitación
// ===============================

let lluviaDibujada = false;

async function dibujarLluvia() {

    if (lluviaDibujada) return;

    lluviaDibujada = true;

    const respuesta = await fetch("http://localhost:8000/ultimo");

    const datos = await respuesta.json();

    let color = "#90CAF9";

    if (datos.precipitacion > 5)
        color = "#42A5F5";

    if (datos.precipitacion > 15)
        color = "#1565C0";

    L.circle(
    [-2.170998, -79.922359],
    {
        radius: 12000,
        color: color,
        fillColor: color,
        fillOpacity: 0.25
    }
)
.addTo(capaLluvia)
.bindPopup(
    `<b>Precipitación</b><br>
    ${datos.precipitacion} mm`
);

}
// ===============================
// Dibujar marea
// ===============================
let mareaDibujada = false;

async function dibujarMarea() {

    if (mareaDibujada) return;

    mareaDibujada = true;

    const respuesta = await fetch("http://localhost:8000/ultimo");

    const datos = await respuesta.json();

    // Simulación inicial de nivel del mar
    let nivel = 2.3;

    let color = "#81D4FA";

    if (nivel >= 3.0) {

        color = "#29B6F6";

    }

    if (nivel >= 4.0) {

        color = "#0277BD";

    }

    L.circle(
        [-2.24,-79.91],
        {

            radius:18000,

            color:color,

            fillColor:color,

            fillOpacity:0.20

        }

    )
    .addTo(capaMarea)
    .bindPopup(`
        <b>Marea</b><br>
        Nivel: ${nivel.toFixed(2)} m
    `);

}

// ===============================
// Escenario combinado
// ===============================

let inundacionDibujada = false;

async function dibujarInundacion() {

    if (inundacionDibujada) return;

    inundacionDibujada = true;

    const respuesta = await fetch("http://localhost:8000/ultimo");

    const datos = await respuesta.json();

    // Simulación
    let nivelMarea = 3.8;

    if (
        datos.precipitacion >= 10 &&
        nivelMarea >= 3.5
    ) {

        L.circle(
            [-2.185,-79.89],
            {
                radius:22000,
                color:"#B71C1C",
                fillColor:"#F44336",
                fillOpacity:0.35
            }
        )
        .addTo(capaInundacion)
        .bindPopup(`
            <b>⚠ Riesgo de Inundación</b><br>
            Lluvia intensa + Marea alta
        `);

    }

}
// ===============================
// Ruta de evacuación
// ===============================

let evacuacionDibujada = false;

function dibujarEvacuacion() {

    if (evacuacionDibujada) return;

    evacuacionDibujada = true;

    // Punto de inicio (Centro de Guayaquil)
    const origen = [-2.190, -79.890];

    // Punto seguro (Universidad de Guayaquil)
    const destino = [-2.180, -79.900];

    L.polyline(
        [
            origen,
            destino
        ],
        {
            color: "#1565C0",
            weight: 6,
            dashArray: "10,10"
        }
    )
    .addTo(capaEvacuacion)
    .bindPopup(`
        <b>Ruta de evacuación</b><br>
        Destino seguro
    `);

    L.marker(origen)
        .addTo(capaEvacuacion)
        .bindPopup("Zona de evacuación");

    L.marker(destino)
        .addTo(capaEvacuacion)
        .bindPopup("Albergue temporal");

}

// ===============================
// Iniciar Dashboard
// ===============================

window.onload = () => {
    cargarDatos();
    cargarGrafico();
    cargarHistorial();
    cargarCiudades();
    dibujarZonas();
    dibujarLluvia();
    dibujarMarea();
    dibujarInundacion();
    dibujarEvacuacion();

};

setInterval(cargarDatos, 5000);
setInterval(cargarGrafico, 5000);
setInterval(cargarHistorial, 5000);