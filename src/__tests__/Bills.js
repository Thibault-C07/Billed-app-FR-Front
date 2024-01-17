/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import Bills from "../containers/Bills";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Expectation
      const windowIconActive = windowIcon.classList.contains("active-icon");
      expect(windowIconActive).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    describe("When I click on new bill button", () => {
      test("Then I should be sent on the new bill page", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBills = new Bills({
          document,
          onNavigate,
          localStorage: window.localStorage,
          store: null,
        });
        const btnNewBill = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn(newBills.handleClickNewBill);
        btnNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(btnNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });
    describe("When I click on first eye icon", () => {
      test("Then modal should open", () => {
        Object.defineProperty(window, localStorage, {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBills = new Bills({
          document,
          onNavigate,
          localStorage: window.localStorage,
          store: null,
        });
        $.fn.modal = jest.fn();
        const handleClickIconEye = jest.fn(() => {
          newBills.handleClickIconEye;
        });
        const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
        firstEyeIcon.addEventListener("click", handleClickIconEye);
        fireEvent.click(firstEyeIcon);
        expect(handleClickIconEye).toHaveBeenCalled();
        expect($.fn.modal).toHaveBeenCalled();
      });
    });
  });
});

// Test integration GET
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      expect(
        await waitFor(() => screen.getByText("Mes notes de frais"))
      ).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return { list: () => Promise.reject(new Error("Erreur 404")) };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 404/));
      expect(message).toBeTruthy();
    });

    test("Then fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return { list: () => Promise.reject(new Error("Erreur 500")) };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 500/));
      expect(message).toBeTruthy();
    });
  });
});
