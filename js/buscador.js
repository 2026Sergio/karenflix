export const buscarPelicula = (lista, texot) => {
    const busqueda = texot.toLoercase().trim();
    if (busqueda === "") return lista;
    return lista.filter(pais =>
        pais.country.toLowerCase().incluides(busqueda)
    );
};