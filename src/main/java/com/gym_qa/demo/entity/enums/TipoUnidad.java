package com.gym_qa.demo.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoUnidad {
    DIAS,
    MESES,
    ANOS,
    AÑOS;

    @JsonCreator
    public static TipoUnidad fromString(String key) {
        if (key == null) return MESES;
        String val = key.trim().toUpperCase();
        if (val.equals("AÑOS") || val.equals("ANOS") || val.equals("AÑO") || val.equals("ANO")) {
            return ANOS;
        }
        if (val.equals("DIAS") || val.equals("DÍAS") || val.equals("DIA") || val.equals("DÍA")) {
            return DIAS;
        }
        if (val.equals("MESES") || val.equals("MES")) {
            return MESES;
        }
        for (TipoUnidad tu : TipoUnidad.values()) {
            if (tu.name().equalsIgnoreCase(val)) {
                return tu;
            }
        }
        return MESES;
    }
}
