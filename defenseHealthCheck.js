/*
 * Script Name: Defense Health Check
 * Version: v1.1.3
 * Last Updated: 2023-09-03
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2022-12-14
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'defenseHealthCheck',
        name: 'Defense Health Check',
        version: 'v1.1.3',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/defense-health-check.289880/',
    },
    translations: {
        en_DK: {
            'Defense Health Check': 'Defense Health Check',
            Help: 'Help',
            'Redirecting...': 'Redirecting...',
            'This script needs to be run on village overview!':
                'This script needs to be run on village overview!',
            'There was an error fetching troops stationed on your village!':
                'There was an error fetching troops stationed on your village!',
            'There was an error fetching simulation data!':
                'There was an error fetching simulation data!',
            'Check Stack Health': 'Check Stack Health',
            'Take into account incoming support.':
                'Take into account incoming support.',
            'Invalid input!': 'Invalid input!',
            '[SIM]': '[SIM]',
            'more nuke like this is killed.': 'more nuke like this is killed.',
            'more nukes like this are killed.':
                'more nukes like this are killed.',
            'No nuke is killed!': 'No nuke is killed!',
            'Enable Nighbonus': 'Enable Nighbonus',
        },
        hu_HU: {
            'Defense Health Check': 'VÃ©delem levizsgÃ¡lÃ³',
            Help: 'SegÃ­tsÃ©g',
            'Redirecting...': 'ÃtÃ­rÃ¡nyÃ­tÃ¡s...',
            'This script needs to be run on village overview!':
                'A scriptet a falu Ã¡ttekintÃ©snÃ©l kell futtatni!',
            'There was an error fetching troops stationed on your village!':
                'Valami hiba jÃ¶tt fel a faluban lÃ©vÅ‘ sereg kiolvasÃ¡sa kÃ¶zben!',
            'There was an error fetching simulation data!':
                'Hiba keletkezett a szimulÃ¡ciÃ³ lÃ©trehozÃ¡sa kÃ¶zben!',
            'Check Stack Health': 'Sereg ellenÅ‘rzÃ©se',
            'Take into account incoming support.':
                'BejÃ¶vÅ‘ erÅ‘sÃ­tÃ©sek figyelembe vÃ©tele.',
            'Invalid input!': 'Ã‰rvÃ©nytelen bemenetel!',
            '[SIM]': '[SZIM]',
            'more nuke like this is killed.': 'hasonlÃ³ nuke megfogva.',
            'more nukes like this are killed.': 'hasonlÃ³ nuke megfogva!',
            'No nuke is killed!': 'Egyetlen egy nuket sem fog meg!',
            'Enable Nighbonus': 'Ã‰jszakai bÃ³nusz figyelembe vÃ©tele',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['overview'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');
        const gameScreen = twSDK.getParameterByName('screen');
        const gameMode = twSDK.getParameterByName('mode');

        const DEFAULT_NUKE = {
            axe: 6800,
            spy: 50,
            light: 2800,
            marcher: 500,
            ram: 300,
            catapult: 150,
        };

        if (!game_data.units.includes('marcher')) {
            delete DEFAULT_NUKE.marcher;
        }

        // check if we are on a valid screen
        (function () {
            if (isValidScreen) {
                // build user interface
                buildUI();

                // register action handlers
                handleCheckHealthStatus();
            } else {
                if (gameScreen === 'place' && gameMode === 'sim') {
                    $.getScript(
                        'https://twscripts.dev/scripts/fillTroopsInSimulator.js'
                    );
                } else {
                    UI.InfoMessage(twSDK.tt('Redirecting...'));
                    twSDK.redirectTo('overview');
                }
            }
        })();

        // Render: Build the user interface
        function buildUI() {
            const unitAmounts =
                JSON.parse(
                    localStorage.getItem(
                        `${scriptConfig.scriptData.prefix}_data`
                    )
                ) || DEFAULT_NUKE;

            let tableRows = ``;
            Object.keys(DEFAULT_NUKE).forEach((unit) => {
                tableRows += `
                <tr>
                    <td class="ra-tac" width="40%">
                        <img src="/graphic/unit/unit_${unit}.png">
                    </td>
                    <td class="ra-tac" width="60%">
                        <input type="text" pattern="\d*" class="ra-input unit_${unit}" data-unit="${unit}" value="${
                    unitAmounts[unit] || 0
                }" />
                    </td>
                </tr>
            `;
            });

            const content = `
                <div class="ra-mb15">
                    <table class="ra-table ra-table-v3 ra-unit-amounts" width="100%">
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                <div class="ra-mb15">
                    <label for="raCheckFetchIncomings" class="ra-label">
                        <input type="checkbox" checked id="raCheckFetchIncomings"> ${twSDK.tt(
                            'Take into account incoming support.'
                        )}
                    </label>
                </div>
                <div class="ra-mb15">
                    <label for="raNightBonus" class="ra-label">
                        <input type="checkbox" id="raNightBonus"> ${twSDK.tt(
                            'Enable Nighbonus'
                        )}
                    </label>
                </div>
                <div class="ra-mb15">
                    <a href="javascript:void(0);" id="raCalculateHealthCheckBtn" class="btn">
                        ${twSDK.tt('Check Stack Health')}
                    </a>
                </div>
                <div class="ra-mb15" id="raHealthCheckResult" style="display:none;"></div>
            `;

            const customStyle = `
                .ra-input { padding: 5px; width: 80%; text-align: center; font-size: 14px; }
                .ra-mt5 { margin-top: 5px; display: inline-block; }
                .ra-alert-box { border-width: 2px; border-radius: 4px; background: #fff3d3; padding: 5px; }
                .ra-danger { border-color: #ff0000; }
                .ra-success { border-color: #219b24; }
            `;

            twSDK.renderFixedWidget(
                content,
                'raDefenseHealthCheck',
                'ra-defense-health-check',
                customStyle
            );

            setTimeout(() => {
                const nonEmptyValues = Object.values(unitAmounts).filter(
                    (item) => item !== 0
                );
                if (nonEmptyValues.length) {
                    jQuery('#raCalculateHealthCheckBtn').trigger('click');
                }
            }, 1);
        }

        // Action Handler: Check health of stack
        function handleCheckHealthStatus() {
            jQuery('#raCalculateHealthCheckBtn').on(
                'click',
                async function (e) {
                    e.preventDefault();

                    jQuery(this).addClass('btn-disabled');
                    setTimeout(() => {
                        jQuery(this).removeClass('btn-disabled');
                    }, 300);

                    // collect user input
                    const villageId = twSDK.getParameterByName('village');
                    const shouldCheckIncomingSupport = jQuery(
                        '#raCheckFetchIncomings'
                    ).is(':checked');
                    const incomingSupport = shouldCheckIncomingSupport
                        ? await fetchIncomingSupport(villageId)
                        : {};
                    const isNightBonus = jQuery('#raNightBonus').is(':checked');

                    // collect troop amounts
                    const defTroops = countTotalTroops(incomingSupport);

                    let offTroops = {};
                    jQuery('.ra-unit-amounts .ra-input').each(function () {
                        const unit = jQuery(this).attr('data-unit');
                        const amount = jQuery(this).val();

                        offTroops = {
                            ...offTroops,
                            [unit]: parseInt(amount) || 0,
                        };
                    });

                    const nonEmptyValues = Object.values(offTroops).filter(
                        (item) => item !== 0
                    );

                    if (!nonEmptyValues.length) {
                        UI.ErrorMessage(twSDK.tt('Invalid input!'));
                        return;
                    }

                    localStorage.setItem(
                        `${scriptConfig.scriptData.prefix}_data`,
                        JSON.stringify(offTroops)
                    );

                    const simulationUrl = buildSimulatorUrl(
                        defTroops,
                        offTroops,
                        isNightBonus
                    );
                    const simulationResults = await fetchSimulationResult(
                        simulationUrl
                    );

                    let content = ``;
                    if (simulationResults) {
                        if (simulationResults > 10) {
                            content = `
                                <div class="info_box ra-alert-box ra-success">
                                    <img src="/graphic/stat/green.png"> <b>${simulationResults}</b> ${twSDK.tt(
                                'more nukes like this are killed.'
                            )}</b>
                                    <a href="${simulationUrl}" target="_blank" rel="noreferrer">
                                        ${twSDK.tt('[SIM]')}
                                    </a>
                                </div>
                            `;
                        } else {
                            content = `
                                <div class="info_box ra-alert-box">
                                    <img src="/graphic/stat/yellow.png"> <b>${simulationResults}</b> ${twSDK.tt(
                                simulationResults === 1
                                    ? 'more nuke like this is killed.'
                                    : 'more nukes like this are killed.'
                            )}</b>
                                    <a href="${simulationUrl}" target="_blank" rel="noreferrer">
                                        ${twSDK.tt('[SIM]')}
                                    </a>
                                </div>
                            `;
                        }
                    } else {
                        content = `
                            <div class="info_box ra-alert-box ra-danger">
                                <img src="/graphic/stat/red.png"> <b>${twSDK.tt(
                                    'No nuke is killed!'
                                )}</b>
                                <a href="${simulationUrl}" target="_blank" rel="noreferrer">
                                    ${twSDK.tt('[SIM]')}
                                </a>
                            </div>
                        `;
                    }

                    jQuery('#raHealthCheckResult').fadeIn(300);
                    jQuery('#raHealthCheckResult').html(content);
                }
            );
        }

        // Helper: Fetch the simulation result
        async function fetchSimulationResult(simulationUrl) {
            try {
                const villageEffects = await jQuery
                    .get(simulationUrl)
                    .then((response) => {
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(
                            response,
                            'text/html'
                        );

                        try {
                            const simulationResults =
                                jQuery(htmlDoc).find('#simulation_result');
                            const result = jQuery(simulationResults)
                                .siblings('p')
                                ?.text()
                                ?.match(/\d+/)[0];

                            return result;
                        } catch (error) {
                            return 0;
                        }
                    });

                return villageEffects;
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error fetching simulation data!')
                );
                console.error(`${scriptInfo} Error: `, error);
            }
        }

        // Helper: Build the simulation URL
        function buildSimulatorUrl(defTroops, offTroops, isNightBonus) {
            const wall = parseInt(game_data.village.buildings.wall);
            const villageId = game_data.village.id;

            let queryParams = `&mode=sim&simulate&def_wall=${wall}&id=${villageId}`;

            // def unit amounts
            Object.entries(defTroops).forEach(
                ([unit, amount]) => (queryParams += `&def_${unit}=${amount}`)
            );

            // off unit amounts
            Object.entries(offTroops).forEach(
                ([unit, amount]) => (queryParams += `&att_${unit}=${amount}`)
            );

            // church
            const villageBuildings = Object.keys(game_data.village.buildings);
            if (
                villageBuildings.includes('church') ||
                villageBuildings.includes('church_f')
            ) {
                queryParams += `&belief_def=on&belief_att=on`;
            }

            // TODO: def buffs
            queryParams += '&def_benefits=';

            // TODO: off buffs
            queryParams += '&att_benefits=';

            // TODO: nightbonus
            if (isNightBonus) queryParams += '&night=on';

            return `${game_data.link_base_pure}place${queryParams}`;
        }

        // Fetch incomings information for village
        async function fetchIncomingSupport(villageId) {
            try {
                const urlToFetch = TribalWars.buildURL('get', 'place', {
                    mode: 'call',
                    village: villageId,
                    target: villageId,
                });
                const response = await jQuery.get(urlToFetch);
                const htmlDoc = jQuery.parseHTML(response);
                const troopsRows = jQuery(htmlDoc).find(
                    '#support_sum tbody tr'
                );

                let troopsInVillage = {};
                game_data.units.forEach((unit) => {
                    troopsRows.each(function () {
                        const unitAmount = jQuery(this)
                            .find(`td[data-unit="${unit}"]`)
                            .text()
                            .trim();
                        if (unitAmount) {
                            troopsInVillage = {
                                ...troopsInVillage,
                                [unit]: parseInt(unitAmount),
                            };
                        }
                    });
                });

                return troopsInVillage;
            } catch (error) {
                UI.ErrorMessage(error.message);
                console.error(`${scriptInfo} Error: `, error);
            }
        }

        // Helper: Sum total troops
        function countTotalTroops(incomingSupport) {
            let currentVillageUnits = {};
            jQuery('#unit_overview_table tbody tr.all_unit').each(function () {
                const unit = jQuery(this).find('.unit_link').attr('data-unit');
                const amount = jQuery(this).find('[data-count]').text().trim();
                currentVillageUnits = {
                    ...currentVillageUnits,
                    [unit]: amount,
                };
            });

            let totalTroops = {};
            game_data.units.forEach((unit) => {
                const unitAmountInc = parseInt(incomingSupport[unit]) || 0;
                const unitAmountCurrent =
                    parseInt(currentVillageUnits[unit]) || 0;

                if (unitAmountInc || unitAmountCurrent) {
                    totalTroops = {
                        ...totalTroops,
                        [unit]: unitAmountInc + unitAmountCurrent,
                    };
                }
            });

            return totalTroops;
        }
    }
);
