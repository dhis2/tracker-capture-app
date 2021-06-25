// Fix to make sure Cov-19 and other hyphen in prøvesvar dialog does not break ugly.
export function makeHyphensInKodebeskrivelseNonBreaking(provesvarliste) {
    try {
        return provesvarliste.map(svar => ({...svar, funn: svar.funn.map(singleFunn => ({...singleFunn, kodebeskrivelse: singleFunn.kodebeskrivelse.replaceAll('-','‑')}))}));
    } catch(err) {
        return provesvarliste;
    }
}