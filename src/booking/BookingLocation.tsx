/* eslint-disable react/jsx-no-target-blank */
import { Button } from "baseui/button";
import { VaccineCentre } from "../VaxComponents";
import {
  DateLocationsPair,
  LocationSlotsPair,
  SlotWithAvailability,
} from "./BookingDataTypes";
import { getDistanceKm } from "../utils/distance";
import { parse } from "date-fns";
import { Coords } from "../location-picker/LocationPicker";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { enqueueAnalyticsEvent } from "../utils/analytics";
import { differenceInDays } from "date-fns/esm";

import { useSeen } from "../utils/useSeen";

type BookingLocationProps = {
  locationSlotsPair: LocationSlotsPair;
  coords: Coords;
  activeDate: DateLocationsPair;
  radiusKm: number;
};

const BookingLocation: FunctionComponent<BookingLocationProps> = ({
  locationSlotsPair,
  coords,
  radiusKm,
  activeDate,
}) => {
  const { t } = useTranslation("common");
  const ref = useRef() as any;
  const seen = useSeen(ref, "20px");
  const [slots, setSlots] = useState<SlotWithAvailability[] | undefined>();

  const getSlots = async (url: string) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
          groupSize: 1,
          url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
          timeZone: "Pacific/Auckland",
        }),
      });
      const dataStr = await res.text();
      let data;

      data = JSON.parse(dataStr);
      return data;
    } catch (e) {
      console.log("Couldn't retreive slots");
      return;
    }
  };

  useEffect(() => {
    async function load() {
      if (!seen || slots) {
        return;
      }
      const response = await getSlots(
        `https://moh2.weston.sh/public/locationsz/${locationSlotsPair.location.extId}/date/${activeDate.dateStr}/slots`
      );
      if (response) {
        setSlots(response.slotsWithAvailability);
      }
    }
    load();
  }, [
    seen,
    slots,
    setSlots,
    locationSlotsPair.location.extId,
    activeDate.dateStr,
  ]);

  const slotsToDisplay =
    slots && slots.length > 0 ? slots : locationSlotsPair.slots;
  return (
    <VaccineCentre ref={ref}>
      <h3>{locationSlotsPair.location.name}</h3>
      <p>
        {locationSlotsPair.location.displayAddress} (
        {t("core.kmAway", {
          distance: Math.floor(
            getDistanceKm(coords, locationSlotsPair.location.location)
          ),
        })}
        )
      </p>
      <p>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${locationSlotsPair.location.location.lat},${locationSlotsPair.location.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            enqueueAnalyticsEvent("Get Directions clicked", {
              radiusKm,
              spotsAvailable: locationSlotsPair.slots?.length || 0,
              bookingDateInDays: differenceInDays(
                parse(activeDate.dateStr, "yyyy-MM-dd", new Date()),
                new Date()
              ),
            })
          }
        >
          {t("core.getDirections")}
        </a>
      </p>
      <a
        href="https://bookmyvaccine.covid19.health.nz"
        target="_blank"
        referrerPolicy="origin"
        rel="noreferrer"
      >
        <div className="ButtonConstraint">
          <Button
            overrides={{
              Root: {
                style: {
                  width: "100%",
                  marginTop: "1rem",
                  marginRight: 0,
                  marginBottom: "1rem",
                  marginLeft: 0,
                },
              },
            }}
            onClick={() =>
              enqueueAnalyticsEvent("Make a Booking clicked", {
                locationName: locationSlotsPair.location.name,
                radiusKm,
                spotsAvailable: slotsToDisplay?.length || 0,
                bookingDateInDays: differenceInDays(
                  parse(activeDate.dateStr, "yyyy-MM-dd", new Date()),
                  new Date()
                ),
              })
            }
          >
            {t("core.makeABooking")}
          </Button>
        </div>
      </a>
      <p
        style={{
          marginTop: "0.25rem",
          marginRight: 0,
          marginBottom: "0.5rem",
          marginLeft: 0,
        }}
      >
        {t("calendar.modal.availableSlots")}
      </p>
      <section>
        {/* <p>1am</p> */}
        {slotsToDisplay?.map((slot) => (
          <p key={slot.localStartTime}>
            {parse(
              slot.localStartTime,
              "HH:mm:ss",
              new Date()
            ).toLocaleTimeString("en-NZ", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        ))}
      </section>
    </VaccineCentre>
  );
};

export default BookingLocation;