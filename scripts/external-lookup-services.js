/* global angular, moment, dhis2 */

'use strict';

/* Services */

var externalLookupServices = angular.module('externalLookupServices', ['ngResource'])

.service('FNrLookupService', function($http, DHIS2URL, $translate, NotificationService) {
        var not_supported_message_shown_previously = false;
        return {
            lookupFnr: function(fNr,kommuneNr) {
                var url = '../' + DHIS2URL + '/person/sok';
                var promise = $http({
                    method: 'POST',
                    url: url,
                    data: {fnr:fNr, kommunenr:kommuneNr},
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    if(response.data.statusFolkeregister == 'NOT_SUPPORTED' && !not_supported_message_shown_previously) {
                        errorMsgHdr = "Folkeregisteroppslag må aktiveres for din kommune"
                        errorMsgBody = `<p>For å hente data fra folkeregisteret må kommunen inngå avtale med KS om bruk av Fiks folkeregister. Dette må dere gjøre:<br>
                                <ol>
                                    <li>Dere må fylle ut skjemaet RF – 1514 «Søknad om tilgang til Folkeregisteret» i Altinn.</li>
                                    <li>Dere må deretter tildele KS rettighet til å bruke folkeregisteropplysninger på deres vegne.</li>
                                    <li>Dere må inngå avtale med KS om bruk av Fiks folkeregister.<br>
                                    Avtalen og veiledning til skjemaene i Altinn finner dere her: <a target="_blank" href="https://svarut.wordpress.com/fiks/avtalen/">https://svarut.wordpress.com/fiks/avtalen/</a></li>
                                </ol>
                            </p>
                            
                            <p>Når dere har signert og sendt inn avtalen, kan dere sette opp tjenesten på <a target="_blank" href="https://forvaltning.fiks.ks.no/">forvaltningsiden til Fiks-plattformen</a>. Dere må deretter aktivere bruk av folkeregisteret i konfigurasjonen for Fiks smittesporing.</p>
                            
                            <p>Ta gjerne kontakt med KS på <a target="_blank" href="mailto:smittesporing@ks.no">smittesporing@ks.no</a> hvis du har spørsmål.</p>
                            
                            <p>Når folkeregisteret ikke er aktivert, vil kun e-post og telefonnummer hentes fra kontakt- og reservasjonsregisteret.</p>`;
                        not_supported_message_shown_previously = true;
                    }

                    if(response.data.statusFolkeregister == 'NONE') {
                        errorMsgBody = 'Fant ingen data på det angitte personnummeret i folkeregisteret: ' + fNr + ' Data om personen må legges inn manuelt i skjemaet under.';
                    }

                    if(response.data.statusFolkeregister == 'FAILED') {
                        errorMsgBody = 'Noe gikk galt i tjenesten for uthenting av data om person fra folkeregisteret. '
                            + 'Prøv igjen senere eller fyll inn persondata manuelt.';
                    }
                    
                    if(errorMsgBody) {
                        NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    }                    

                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved henting av data om person:' + fNr;

                    if(error.status == 404) {
                        errorMsgBody = 'Tjeneste for henting av data om person er ikke tilgjengelig. '
                            + 'Prøv igjen senere eller fyll inn persondata manuelt.';
                    }

                    if(error.status == 403) {
                        errorMsgBody = 'Feil ved henting av data, prøv å logge inn på nytt.';
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            }
        }
    }
)
