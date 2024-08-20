"use strict";

const GRID_UI = document.querySelector(".grid");
const ANTERIOR_BOTON = document.querySelector("#anterior");
const SIGUIENTE_BOTON = document.querySelector("#siguiente");
const elementos_recorridos = document.querySelector(".current_pag");
const elementos_totales = document.querySelector("#siguiente");
let current_page = 1;
const ELEMENTO_INFO = document.querySelector("#info");
const TITULO_INFO = ELEMENTO_INFO.querySelector(
    "#info_card #info_card_head h3"
);
const CUERPO_INFO = ELEMENTO_INFO.querySelector("#info_card #info_card_body");

function capitalizar(cadena) {
    return cadena[0].toUpperCase() + cadena.slice(1);
}

function Deshacer_Underscore(string) {
    return capitalizar(string.split("_").join(" "));
}

function encontrarNumeros(cadena) {
    const PATRON = /[0-9]/g;
    return cadena.match(PATRON).join("");
}

function cadenaConGuionesBajos(cadena) {
    return cadena.split(" ").join("_");
}

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

async function cargarJsonPaginaActual(pagina) {
    const paginaActual = document.location.pathname
        .split("/")
        .pop()
        .split(".")
        .reverse()
        .pop();

    if (paginaActual !== "index" && paginaActual !== "") {
        let url;
        if (!pagina) {
            url = `https://swapi.py4e.com/api/${paginaActual}/`;
        } else {
            url = `https://swapi.py4e.com/api/${paginaActual}/?page=${pagina}`;
        }
        return await obtenerDatosAPI(url);
    }
}

const cacheAPI = new Map();

async function cargarJsonItem(url) {
    if (cacheAPI.has(url)) {
        return cacheAPI.get(url);
    }
    const datos = await obtenerDatosAPI(url);
    cacheAPI.set(url, datos);
    return datos;
}

async function cargarPagina(pagina) {
    const json = await cargarJsonPaginaActual(pagina);
    const elementoActual = document.querySelector(".current_pag");
    if (json.next || json.previous) {
        const elementoTotal = document.querySelector(".total_pags");
        elementoActual.textContent =
            Number(json.next[json.next.length - 1]) * 10 - 10;
        elementoTotal.textContent = json.count;
    } else {
        elementoActual.parentElement.parentElement.remove();
    }

    const ulPrincipal = document.querySelector("main ul");
    json.results.forEach((item) => {
        const item_element = document.createElement("li");
        item_element.classList.add("card", "selectDisable");
        item_element.value = encontrarNumeros(item.url.slice(-4));
        if (ObtenerITEM_URL(item, "films", "bool")) {
            item_element.textContent = item.title;
        } else {
            item_element.textContent = item.name;
        }
        ulPrincipal.appendChild(item_element);
    });
    return json;
}

function actualizarURL(param, valor) {
    const parametrosURL = new URLSearchParams(window.location.search);
    if (valor) {
        parametrosURL.set(param, valor);
        const nuevaURL = `${
            window.location.pathname
        }?${parametrosURL.toString()}`;
        history.pushState({}, "", nuevaURL);
    } else {
        history.pushState({}, "", window.location.pathname);
    }
}

async function observarURL(elementoInfo, items, jsonObtenido) {
    const parametrosURL = new URLSearchParams(window.location.search);
    const id = parametrosURL.get("id");
    const page = parametrosURL.get("page");

    const itemCoincidente = Array.from(items).find((item) => item.value == id);
    if (itemCoincidente) {
        await cargarInfo(id, jsonObtenido);
        elementoInfo.classList.remove("no_display");
        elementoInfo.style.opacity = 1;
    }
}

function ObtenerITEM_URL(item, string, bool_or_Number) {
    if (bool_or_Number === "bool") {
        return item.url.includes(string);
    } else {
        return item.url.split("/")[bool_or_Number];
    }
}

function obtenerParametroURL(key) {
    const URLParams = new URLSearchParams(window.location.search)
    return URLParams.get(key)
}


async function cargarInfo(id, jsonObtenido) {
    const posicion = jsonObtenido.results.find(
        (pos) => id === encontrarNumeros(pos.url.slice(-4))
    );

    if (posicion) {
        await estructurarItems(posicion);
    }
}

async function crearUlInfoForOf(clave, objetoItem) {
    if (objetoItem[clave].length > 0) {
        const tituloUl = document.createElement("strong");
        tituloUl.textContent = Deshacer_Underscore(clave);
        const elementoUl = document.createElement("ul");
        elementoUl.classList.add("flex", "wrap", "j_c");

        const promesas = objetoItem[clave].map(async (valor) => {
            const jsonClave = await cargarJsonItem(valor);
            const pathname = new URL(jsonClave.url);
            const id = pathname.pathname.split("/")[3];
            const pagina = Math.ceil(id / 10);
            const elementoLi = document.createElement("li");
            elementoLi.classList.add("card");
            const elementoA = document.createElement("a");
            elementoA.href = `${pathname.pathname.split("/")[2]}.html?page=${pagina}&id=${id}`;
            if (ObtenerITEM_URL(jsonClave, "films", "bool")) {
                elementoA.textContent = jsonClave.title;
            } else {
                elementoA.textContent = jsonClave.name;
            }
            elementoLi.appendChild(elementoA);
            return elementoLi;
        });

        const itemsLista = await Promise.all(promesas);
        itemsLista.forEach((li) => elementoUl.appendChild(li));

        return [tituloUl, elementoUl];
    }
}

async function crearParStrongTexto(titulo, contenido) {
    if (
        contenido.length > 0 &&
        titulo !== "title" &&
        titulo !== "name" &&
        titulo !== "created" &&
        titulo !== "edited" &&
        titulo !== "url"
    ) {
        const strong = document.createElement("strong");
        strong.textContent = Deshacer_Underscore(titulo);
        if (!URL.canParse(contenido)) {
            const p = document.createElement("p");
            p.textContent = contenido;
            return [strong, p];
        } else {
            const jsonClave = await cargarJsonItem(contenido);
            const pathname = new URL(jsonClave.url);
            const id = Number(pathname.pathname.split("/")[3]);
            const pagina = Math.ceil(id / 10);
            const a = document.createElement("a");
            a.classList.add("card");
            a.href = `${pathname.pathname.split("/")[2]}.html?page=${pagina}&id=${id}`;
            if (ObtenerITEM_URL(jsonClave, "films", "bool")) {
                a.textContent = jsonClave.title;
            } else {
                a.textContent = jsonClave.name;
            }
            return [strong, a];
        }
    }
}

async function estructurarItems(item) {
    if (ObtenerITEM_URL(item, "films", "bool")) {
        TITULO_INFO.textContent = item.title;
    } else {
        TITULO_INFO.textContent = item.name;
    }

    const elementos = [];

    for (const key of Object.keys(item)) {
        if (Array.isArray(item[key])) {
            const UlElement = await crearUlInfoForOf(key, item);
            elementos.push(UlElement);
        } else {
            const PElement = await crearParStrongTexto(key, item[key]);
            elementos.push(PElement);
        }
    }

    const filtred_elementos = elementos.filter((element) => element);
    filtred_elementos.flat().forEach((elem) => CUERPO_INFO.appendChild(elem));
}

function evaluacionNavegacion(e, valor_maximo) {
    if (e.target.id === "siguiente") {
        return Number(elementos_recorridos.textContent) + 10 >
            Number(valor_maximo)
            ? false
            : true;
    } else {
        return Number(elementos_recorridos.textContent) - 10 < 1 ? false : true;
    }
}

function ocultarBoton(valor_maximo) {
    if (Number(elementos_recorridos.textContent) + 10 > Number(valor_maximo)) {
        SIGUIENTE_BOTON.classList.add("hidden");
    } else if (Number(elementos_recorridos.textContent) - 10 < 1) {
        ANTERIOR_BOTON.classList.add("hidden");
    } else {
        SIGUIENTE_BOTON.classList.remove("hidden");
        ANTERIOR_BOTON.classList.remove("hidden");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    current_page = obtenerParametroURL("page");
    let jsonObtenido;
    try {
        jsonObtenido = await cargarPagina(current_page);
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
        CUERPO_INFO.textContent = "";
    });

    items.forEach((item) => {
        item.addEventListener("click", () => {
            actualizarURL("id", item.value);
            observarURL(ELEMENTO_INFO, items, jsonObtenido);
        });
    });

    actualizarURL("page", current_page);
    observarURL(ELEMENTO_INFO, items, jsonObtenido);
    ocultarBoton(jsonObtenido.count);
    window.addEventListener("popstate", () => {
        jsonObtenido = cargarPagina(current_page);
        actualizarURL("page", current_page);
        observarURL(ELEMENTO_INFO, items, jsonObtenido);
        ocultarBoton(jsonObtenido.count);
    });

    [SIGUIENTE_BOTON, ANTERIOR_BOTON].forEach((button) => {
        button.addEventListener("click", async (e) => {
            if (evaluacionNavegacion(e, jsonObtenido.count)) {
                GRID_UI.textContent = "";
                if (button.id === "siguiente") {
                    current_page++;
                } else {
                    current_page--;
                }
                jsonObtenido = await cargarPagina(current_page);
                actualizarURL("page", current_page);
                observarURL(ELEMENTO_INFO, items, jsonObtenido);
                ocultarBoton(jsonObtenido.count);
            }
        });
    });
});