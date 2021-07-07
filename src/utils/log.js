function log(type, msg) {
    const labelStyle = 'background: #606060; color: #fff; border-radius: 3px 0 0 3px; padding: 2px 4px; ';
    const contentStyle = 'background: #1475B2; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 4px; ';
    console.info(`%c${type}:%c${msg}`, labelStyle, contentStyle);
}

function error(type, msg) {
    const labelStyle = 'background: #f14101; color: #fff; border-radius: 3px 0 0 3px; padding: 2px 4px; ';
    const contentStyle = 'background: #a3a2a1; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 4px; ';
    console.info(`%c${type}:%c${msg}`, labelStyle, contentStyle);
}

export { log, error };
