"use client";

import { useMemo, useCallback } from "react";
import locationData from "@/data/District.json";

export default function useLocationData() {
  // Array of all division names
  const divisions = useMemo(() => {
    return locationData.map((d) => d.division);
  }, []);

  // Get district/city names for a selected division
  const getDistrictsByDivision = useCallback((divisionName) => {
    if (!divisionName) return [];
    const foundDiv = locationData.find(
      (d) => d.division.toLowerCase() === divisionName.toLowerCase()
    );
    return foundDiv ? foundDiv.districts.map((item) => item.name) : [];
  }, []);

  // Get areas/upazilas for a selected division & district/city
  const getAreasByDistrict = useCallback((divisionName, districtName) => {
    if (!divisionName || !districtName) return [];
    const foundDiv = locationData.find(
      (d) => d.division.toLowerCase() === divisionName.toLowerCase()
    );
    if (!foundDiv) return [];
    const foundDist = foundDiv.districts.find(
      (dist) => dist.name.toLowerCase() === districtName.toLowerCase()
    );
    return foundDist ? foundDist.areas : [];
  }, []);

  return {
    divisions,
    getDistrictsByDivision,
    getAreasByDistrict,
    locationData,
  };
}
