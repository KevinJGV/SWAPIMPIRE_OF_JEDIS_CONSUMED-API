"use strict";

// Referencias a elementos del DOM
const ELEMENTO_INFO = document.querySelector("#info");
const TITULO_INFO = ELEMENTO_INFO.querySelector("#info_card #info_card_head h3");
const CUERPO_INFO = ELEMENTO_INFO.querySelector("#info_card #info_card_body");

// Funciones utilitarias
function capitalizar(cadena) {
    return cadena[0].toUpperCase() + cadena.slice(1);
}

function encontrarNumeros(cadena) {
    const PATRON = /[0-9]/g;
    return cadena.match(PATRON).join("");
}

function cadenaConGuionesBajos(cadena) {
    return cadena.split(" ").join("_");
}

// Función unificada para obtener datos de la API
async function obtenerDatosAPI(url) {
    const cabeceras = {
        "Content-Type": "application/json",
    };

    const opciones = {
        method: "GET",
        headers: cabeceras,
        description: "",
        renders: ["application/json", "text/html"],
        parses: [
            "application/json",
            "application/x-www-form-urlencoded",
            "multipart/form-data",
        ],
    };

    try {
        const respuesta = await fetch(new Request(url, opciones));
        if (!respuesta.ok) {
            throw new Error(`¡Error HTTP! estado: ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error al obtener datos:", error);
        throw error;
    }
}

async function cargarJsonPagina() {
    const paginaActual = document.location.pathname
        .split("/")
        .pop()
        .split(".")
        .reverse()
        .pop();

    if (paginaActual !== "index" && paginaActual !== "") {
        const url = `https://swapi.py4e.com/api/${paginaActual}/`;
        return await obtenerDatosAPI(url);
    }
}

// Caché para respuestas de la API
const cacheAPI = new Map();

async function cargarJsonItem(url) {
    if (cacheAPI.has(url)) {
        return cacheAPI.get(url);
    }
    const datos = await obtenerDatosAPI(url);
    cacheAPI.set(url, datos);
    return datos;
}

async function cargarPagina() {
    const json = await cargarJsonPagina();
    const elementoActual = document.querySelector(".current_pag");
    if (json.next) {
        const elementoTotal = document.querySelector(".total_pags");
        elementoActual.textContent = Number(json.next[json.next.length - 1]) * 10 - 10;
        elementoTotal.textContent = json.count;
    } else {
        elementoActual.parentElement.parentElement.remove();
    }

    const ulPrincipal = document.querySelector("main ul");
    json.results.forEach((pelicula) => {
        const item = document.createElement("li");
        item.classList.add("card", "selectDisable");
        item.value = encontrarNumeros(pelicula.url.slice(-4));
        item.textContent = pelicula.title;
        ulPrincipal.appendChild(item);
    });
    return json;
}

function actualizarURL(valor) {
    const parametrosURL = new URLSearchParams(window.location.search);
    if (valor) {
        parametrosURL.set("id", valor);
        const nuevaURL = `${window.location.pathname}?${parametrosURL.toString()}`;
        history.pushState({}, "", nuevaURL);
    } else {
        history.pushState({}, "", window.location.pathname);
    }
}

async function observarURL(elementoInfo, items, jsonObtenido) {
    const parametrosURL = new URLSearchParams(window.location.search);
    const id = parametrosURL.get("id");

    const itemCoincidente = Array.from(items).find(item => item.value == id);
    if (itemCoincidente) {
        await cargarInfo(id, jsonObtenido);
        elementoInfo.classList.remove("no_display");
        elementoInfo.style.opacity = 1;
    }
}

async function cargarInfo(id, jsonObtenido) {
    const posicion = jsonObtenido.results.find(pos => 
        id === encontrarNumeros(pos.url.slice(-4))
    );

    if (posicion) {
        if (posicion.url.includes("films")) {
            await estructurarPeliculas(posicion);
        } else if (posicion.url.includes("")) {
        } else if (posicion.url.includes("")) {
        } else if (posicion.url.includes("")) {
        } else if (posicion.url.includes("")) {
        } else {
        }
    }
}

async function crearUlInfoForOf(clave, objetoItem) {
    const tituloUl = document.createElement("strong");
    tituloUl.textContent = capitalizar(clave);
    const elementoUl = document.createElement("ul");
    elementoUl.classList.add("flex", "wrap", "j_c");

    const promesas = objetoItem[clave].map(async (valor) => {
        const jsonClave = await cargarJsonItem(valor);
        const elementoLi = document.createElement("li");
        elementoLi.classList.add("card");
        const elementoA = document.createElement("a");
        elementoA.href = `http://127.0.0.1:5500/films.html?id=`;
        elementoA.textContent = jsonClave.name;
        elementoLi.appendChild(elementoA);
        return elementoLi;
    });

    const itemsLista = await Promise.all(promesas);
    itemsLista.forEach(li => elementoUl.appendChild(li));

    return [tituloUl, elementoUl];
}

async function estructurarPeliculas(pelicula) {
    TITULO_INFO.textContent = pelicula.title;

    const elementos = [
        crearParStrongParrafo("Description", pelicula.opening_crawl),
        await crearUlInfoForOf("characters", pelicula),
        await crearUlInfoForOf("planets", pelicula),
        await crearUlInfoForOf("starships", pelicula),
        await crearUlInfoForOf("vehicles", pelicula),
        await crearUlInfoForOf("species", pelicula),
        crearParStrongCita("Director", pelicula.director),
        crearParStrongCita("Producer", pelicula.producer),
        crearParStrongCita("Release Date", pelicula.release_date)
    ];

    elementos.flat().forEach(elem => CUERPO_INFO.appendChild(elem));
}

function crearParStrongParrafo(titulo, contenido) {
    const strong = document.createElement("strong");
    strong.textContent = titulo;
    const p = document.createElement("p");
    p.textContent = contenido;
    return [strong, p];
}

function crearParStrongCita(titulo, contenido) {
    const strong = document.createElement("strong");
    strong.textContent = titulo;
    const q = document.createElement("q");
    q.textContent = contenido;
    return [strong, q];
}

document.addEventListener("DOMContentLoaded", async () => {
    let jsonObtenido;
    try {
        jsonObtenido = await cargarPagina();
    } catch (error) {
        console.error("Error al cargar la página:", error);
        return;
    }

    const items = document.querySelectorAll("main ul li");

    document.querySelector(".exit").addEventListener("click", () => {
        actualizarURL();
        ELEMENTO_INFO.style.opacity = 0;
        ELEMENTO_INFO.classList.add("no_display");
        TITULO_INFO.textContent = "";
        CUERPO_INFO.innerHTML = "";
    });

    items.forEach((item) => {
        item.addEventListener("click", () => {
            actualizarURL(item.value);
            observarURL(ELEMENTO_INFO, items, jsonObtenido);
        });
    });

    window.addEventListener("popstate", () => observarURL(ELEMENTO_INFO, items, jsonObtenido));

    console.log(jsonObtenido);
});

// const SECTION = document.querySelector("section");
// const ANTERIOR_BOTON = document.querySelector("#anterior");
// const SIGUIENTE_BOTON = document.querySelector("#siguiente");
// let current_page;
// let current_json;

// document.addEventListener("DOMContentLoaded", async () => {
//     current_json = await cargarPagina();
//     console.log(current_json);
// });

// ANTERIOR_BOTON.addEventListener("click", async () => {
//     debugger
//     if (current_json.page !== 1) {
//         SECTION.textContent = "";
//         let current_page = getLocalSt("current_page", Number);
//         current_page--;
//         localStorage.setItem("current_page", current_page);
//         current_json = await cargarPagina()
//     }
// });

// SIGUIENTE_BOTON.addEventListener("click", async () => {
//     if (current_json.page !== current_json.total_pages) {
//         SECTION.textContent = "";
//         let current_page = getLocalSt("current_page", Number);
//         current_page++;
//         localStorage.setItem("current_page", current_page);
//         current_json = await cargarPagina()
//     }
// });
