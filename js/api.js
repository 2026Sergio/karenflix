export function obtenerresenia(){
    return fetch("link pnediente")
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Error en la peticion:", error);
        });
}
