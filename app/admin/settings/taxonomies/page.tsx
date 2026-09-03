"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/layout/PageHeader";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

import "./taxonomies.css";

type BusinessDomain = {
  id: number;
  domainCode: string;
  domainName: string;
  description: string | null;
};

type SubcauseOption = {
  subcauseCode: string;
  subcauseName: string;
  description: string | null;
  numericCode: string | null;
};

type CauseOption = {
  causeCode: string;
  causeName: string;
  description: string | null;
  numericCode: string | null;
  subcauses: SubcauseOption[];
};

type AreaGroup = {
  areaCode: string;
  areaName: string;
  areaDescription: string | null;
  areaNumericCode: string | null;
  causes: CauseOption[];
};

export default function TaxonomiesPage() {
  const {
    language,
    messages,
  } = useLanguage();

  const copy =
    messages.taxonomiesPage;

  const [domains, setDomains] =
    useState<BusinessDomain[]>([]);

  const [
    selectedDomainId,
    setSelectedDomainId,
  ] = useState("");

  const [
    domainsLoading,
    setDomainsLoading,
  ] = useState(true);

  const [
    domainsError,
    setDomainsError,
  ] = useState("");

  const [areas, setAreas] =
    useState<AreaGroup[]>([]);

  const [
    expandedAreas,
    setExpandedAreas,
  ] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    showNewArea,
    setShowNewArea,
  ] = useState(false);

  const [areaName, setAreaName] =
    useState("");

  const [
    areaDescription,
    setAreaDescription,
  ] = useState("");

  const [
    areaPreview,
    setAreaPreview,
  ] = useState<{
    areaCode: string;
    numericCode: string;
  } | null>(null);

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [
    savingArea,
    setSavingArea,
  ] = useState(false);

  const [
    areaFormError,
    setAreaFormError,
  ] = useState("");

  const [
    areaFormSuccess,
    setAreaFormSuccess,
  ] = useState("");

  useEffect(() => {
    async function loadDomains() {
      try {
        setDomainsLoading(true);
        setDomainsError("");

        const response =
          await fetch(
            "/api/admin/domains",
            {
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              copy.domainsLoadError
          );
        }

        const nextDomains:
          BusinessDomain[] =
          result.domains ?? [];

        setDomains(nextDomains);

        setSelectedDomainId(
          (current) => {
            if (
              current &&
              nextDomains.some(
                (domain) =>
                  String(domain.id) ===
                  current
              )
            ) {
              return current;
            }

            return nextDomains[0]
              ? String(
                  nextDomains[0].id
                )
              : "";
          }
        );
      } catch (error) {
        setDomains([]);
        setSelectedDomainId("");

        setDomainsError(
          error instanceof Error
            ? error.message
            : copy.domainsLoadError
        );
      } finally {
        setDomainsLoading(false);
      }
    }

    void loadDomains();
  }, [copy.domainsLoadError]);

  useEffect(() => {
    if (!selectedDomainId) {
      setAreas([]);
      setExpandedAreas([]);
      setLoading(false);

      return;
    }

    async function loadTaxonomy() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await fetch(
            `/api/admin/taxonomy/causes?domainId=${encodeURIComponent(
              selectedDomainId
            )}&language=${encodeURIComponent(
              language
            )}`,
            {
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              copy.loadError
          );
        }

        const nextAreas:
          AreaGroup[] =
          result.areas ?? [];

        setAreas(nextAreas);

        setExpandedAreas(
          nextAreas
            .slice(0, 2)
            .map(
              (area) =>
                area.areaCode
            )
        );
      } catch (error) {
        setAreas([]);
        setExpandedAreas([]);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : copy.loadError
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTaxonomy();
  }, [
    selectedDomainId,
    language,
    copy.loadError,
    refreshKey,
  ]);

  useEffect(() => {
    if (
      !showNewArea ||
      !selectedDomainId ||
      !areaName.trim()
    ) {
      setAreaPreview(null);
      setPreviewLoading(false);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setPreviewLoading(true);

          const response =
            await fetch(
              `/api/admin/taxonomy/areas?domainId=${encodeURIComponent(
                selectedDomainId
              )}&name=${encodeURIComponent(
                areaName.trim()
              )}`,
              {
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.error ??
                copy.areaCreate.previewError
            );
          }

          setAreaPreview({
            areaCode:
              result.areaCode,
            numericCode:
              String(
                result.numericCode
              ),
          });

          setAreaFormError("");
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setAreaPreview(null);
          setAreaFormError(
            error instanceof Error
              ? error.message
              : copy.areaCreate.previewError
          );
        } finally {
          setPreviewLoading(false);
        }
      },
      300
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    showNewArea,
    selectedDomainId,
    areaName,
    copy.areaCreate.previewError,
  ]);

  const selectedDomain =
    useMemo(
      () =>
        domains.find(
          (domain) =>
            String(domain.id) ===
            selectedDomainId
        ) ?? null,
      [
        domains,
        selectedDomainId,
      ]
    );

  const summary = useMemo(() => {
    const causes =
      areas.reduce(
        (total, area) =>
          total +
          area.causes.length,
        0
      );

    const subcauses =
      areas.reduce(
        (total, area) =>
          total +
          area.causes.reduce(
            (
              causeTotal,
              cause
            ) =>
              causeTotal +
              cause.subcauses.length,
            0
          ),
        0
      );

    return {
      areas: areas.length,
      causes,
      subcauses,
    };
  }, [areas]);

  const visibleAreas =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return areas;
      }

      return areas
        .map((area) => {
          const areaMatch =
            area.areaName
              .toLowerCase()
              .includes(query) ||
            area.areaCode
              .toLowerCase()
              .includes(query) ||
            (
              area.areaDescription ??
              ""
            )
              .toLowerCase()
              .includes(query);

          const causes =
            area.causes
              .map((cause) => {
                const causeMatch =
                  cause.causeName
                    .toLowerCase()
                    .includes(query) ||
                  cause.causeCode
                    .toLowerCase()
                    .includes(query) ||
                  (
                    cause.description ??
                    ""
                  )
                    .toLowerCase()
                    .includes(query);

                const subcauses =
                  cause.subcauses.filter(
                    (subcause) =>
                      subcause.subcauseName
                        .toLowerCase()
                        .includes(query) ||
                      subcause.subcauseCode
                        .toLowerCase()
                        .includes(query) ||
                      (
                        subcause.description ??
                        ""
                      )
                        .toLowerCase()
                        .includes(query)
                  );

                if (
                  areaMatch ||
                  causeMatch
                ) {
                  return cause;
                }

                if (
                  subcauses.length >
                  0
                ) {
                  return {
                    ...cause,
                    subcauses,
                  };
                }

                return null;
              })
              .filter(
                (
                  cause
                ): cause is CauseOption =>
                  Boolean(cause)
              );

          if (
            areaMatch ||
            causes.length > 0
          ) {
            return {
              ...area,
              causes:
                areaMatch
                  ? area.causes
                  : causes,
            };
          }

          return null;
        })
        .filter(
          (
            area
          ): area is AreaGroup =>
            Boolean(area)
        );
    }, [areas, search]);

  function toggleArea(
    areaCode: string
  ) {
    setExpandedAreas(
      (current) =>
        current.includes(areaCode)
          ? current.filter(
              (code) =>
                code !== areaCode
            )
          : [
              ...current,
              areaCode,
            ]
    );
  }

  function handleDomainChange(
    value: string
  ) {
    setSelectedDomainId(value);
    setSearch("");
    setErrorMessage("");
  }

  function resetAreaForm() {
    setAreaName("");
    setAreaDescription("");
    setAreaPreview(null);
    setAreaFormError("");
    setAreaFormSuccess("");
  }

  function openNewArea() {
    resetAreaForm();
    setShowNewArea(true);
  }

  function closeNewArea() {
    if (savingArea) {
      return;
    }

    setShowNewArea(false);
    resetAreaForm();
  }

  async function createArea(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedDomainId ||
      !areaName.trim() ||
      !areaName.trim()
    ) {
      setAreaFormError(
        copy.areaCreate.requiredError
      );
      return;
    }

    try {
      setSavingArea(true);
      setAreaFormError("");
      setAreaFormSuccess("");

      const response =
        await fetch(
          "/api/admin/taxonomy/areas",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              domainId:
                Number(
                  selectedDomainId
                ),
              language,
              name:
                areaName.trim(),
              description:
                areaDescription.trim() ||
                null,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            copy.areaCreate.saveError
        );
      }

      setAreaFormSuccess(
        copy.areaCreate.success
      );

      setAreaPreview({
        areaCode:
          result.area.areaCode,
        numericCode:
          String(
            result.area.numericCode
          ),
      });

      setRefreshKey(
        (current) =>
          current + 1
      );

      window.setTimeout(() => {
        setShowNewArea(false);
        resetAreaForm();
      }, 650);
    } catch (error) {
      setAreaFormError(
        error instanceof Error
          ? error.message
          : copy.areaCreate.saveError
      );
    } finally {
      setSavingArea(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={
          copy.description
        }
      />

      <section className="taxonomy-domain-panel">
        <div className="taxonomy-domain-field">
          <label
            htmlFor="taxonomy-domain"
          >
            {copy.domainLabel}
          </label>

          <select
            id="taxonomy-domain"
            value={selectedDomainId}
            onChange={(event) =>
              handleDomainChange(
                event.target.value
              )
            }
            disabled={
              domainsLoading ||
              domains.length === 0
            }
            aria-label={
              copy.domainAria
            }
          >
            {domainsLoading && (
              <option value="">
                {
                  copy.loadingDomains
                }
              </option>
            )}

            {!domainsLoading &&
              domains.length === 0 && (
                <option value="">
                  {
                    copy.noDomains
                  }
                </option>
              )}

            {domains.map(
              (domain) => (
                <option
                  key={domain.id}
                  value={String(
                    domain.id
                  )}
                >
                  {
                    domain.domainName
                  }
                </option>
              )
            )}
          </select>
        </div>

        {selectedDomain && (
          <div className="taxonomy-domain-meta">
            <code>
              {
                selectedDomain.domainCode
              }
            </code>

            {selectedDomain.description && (
              <p>
                {
                  selectedDomain.description
                }
              </p>
            )}
          </div>
        )}
      </section>

      {domainsError && (
        <section className="taxonomy-state-card taxonomy-state-error taxonomy-domain-error">
          {domainsError}
        </section>
      )}

      <section className="taxonomy-toolbar">
        <div className="taxonomy-search-wrap">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              copy.searchPlaceholder
            }
            aria-label={
              copy.searchAria
            }
            disabled={
              !selectedDomainId ||
              loading
            }
          />
        </div>

        <div className="taxonomy-actions">
          <button
            type="button"
            className="taxonomy-secondary-button"
            disabled
            title={
              copy.comingSoon
            }
          >
            {
              copy.validateButton
            }
          </button>

          <button
            type="button"
            className="taxonomy-primary-button"
            onClick={openNewArea}
            disabled={
              !selectedDomainId ||
              domainsLoading
            }
          >
            {
              copy.newAreaButton
            }
          </button>
        </div>
      </section>

      <section className="taxonomy-summary">
        <div>
          <strong>
            {summary.areas}
          </strong>
          <span>
            {copy.areasLabel}
          </span>
        </div>

        <div>
          <strong>
            {summary.causes}
          </strong>
          <span>
            {copy.causesLabel}
          </span>
        </div>

        <div>
          <strong>
            {summary.subcauses}
          </strong>
          <span>
            {
              copy.subcausesLabel
            }
          </span>
        </div>
      </section>

      {loading && (
        <section className="taxonomy-state-card">
          {copy.loading}
        </section>
      )}

      {!loading &&
        errorMessage && (
          <section className="taxonomy-state-card taxonomy-state-error">
            {errorMessage}
          </section>
        )}

      {!domainsLoading &&
        !domainsError &&
        domains.length === 0 && (
          <section className="taxonomy-state-card">
            {copy.noDomains}
          </section>
        )}

      {!loading &&
        !errorMessage &&
        selectedDomainId && (
          <section className="taxonomy-tree">
            {visibleAreas.map(
              (area) => {
                const expanded =
                  expandedAreas.includes(
                    area.areaCode
                  ) ||
                  Boolean(
                    search.trim()
                  );

                return (
                  <article
                    key={
                      area.areaCode
                    }
                    className="taxonomy-area-card"
                  >
                    <button
                      type="button"
                      className="taxonomy-area-header"
                      onClick={() =>
                        toggleArea(
                          area.areaCode
                        )
                      }
                    >
                      <div className="taxonomy-area-title">
                        <span
                          className={[
                            "taxonomy-chevron",
                            expanded
                              ? "expanded"
                              : "",
                          ].join(
                            " "
                          )}
                          aria-hidden="true"
                        >
                          ⌄
                        </span>

                        <div>
                          <div className="taxonomy-node-heading">
                            <h2>
                              {
                                area.areaName
                              }
                            </h2>

                            <code>
                              {
                                area.areaCode
                              }
                            </code>
                          </div>

                          {area.areaDescription && (
                            <p>
                              {
                                area.areaDescription
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="taxonomy-count">
                        {
                          area.causes
                            .length
                        }{" "}
                        {
                          copy.causesLabel
                        }
                      </span>
                    </button>

                    {expanded && (
                      <div className="taxonomy-area-body">
                        {area.causes.map(
                          (
                            cause
                          ) => (
                            <div
                              key={
                                cause.causeCode
                              }
                              className="taxonomy-cause-block"
                            >
                              <div className="taxonomy-cause-header">
                                <div>
                                  <div className="taxonomy-node-heading">
                                    <h3>
                                      {
                                        cause.causeName
                                      }
                                    </h3>

                                    <code>
                                      {
                                        cause.causeCode
                                      }
                                    </code>
                                  </div>

                                  {cause.description && (
                                    <p>
                                      {
                                        cause.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <span className="taxonomy-count taxonomy-count-light">
                                  {
                                    cause
                                      .subcauses
                                      .length
                                  }{" "}
                                  {
                                    copy.subcausesLabel
                                  }
                                </span>
                              </div>

                              {cause
                                .subcauses
                                .length >
                                0 && (
                                <div className="taxonomy-subcauses-grid">
                                  {cause.subcauses.map(
                                    (
                                      subcause
                                    ) => (
                                      <div
                                        key={
                                          subcause.subcauseCode
                                        }
                                        className="taxonomy-subcause-card"
                                      >
                                        <div className="taxonomy-node-heading taxonomy-node-heading-compact">
                                          <strong>
                                            {
                                              subcause.subcauseName
                                            }
                                          </strong>

                                          <code>
                                            {
                                              subcause.subcauseCode
                                            }
                                          </code>
                                        </div>

                                        {subcause.description && (
                                          <p>
                                            {
                                              subcause.description
                                            }
                                          </p>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}

            {visibleAreas.length ===
              0 && (
              <div className="taxonomy-state-card">
                {
                  copy.noResults
                }
              </div>
            )}
          </section>
        )}

      {showNewArea && (
        <div
          className="taxonomy-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeNewArea();
            }
          }}
        >
          <section
            className="taxonomy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-area-title"
          >
            <div className="taxonomy-modal-header">
              <div>
                <span>
                  {
                    copy.areaCreate.eyebrow
                  }
                </span>
                <h2 id="new-area-title">
                  {
                    copy.areaCreate.title
                  }
                </h2>
                <p>
                  {
                    copy.areaCreate.description
                  }
                </p>
              </div>

              <button
                type="button"
                className="taxonomy-modal-close"
                onClick={closeNewArea}
                disabled={savingArea}
                aria-label={
                  copy.areaCreate.close
                }
              >
                ×
              </button>
            </div>

            <form
              className="taxonomy-area-form"
              onSubmit={createArea}
            >
              <div className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>
                    {
                      copy.areaCreate.contentTitle
                    }
                  </strong>
                  <span>
                    {
                      copy.areaCreate.required
                    }
                  </span>
                </div>

                <div className="taxonomy-language-badge">
                  <span>
                    {
                      copy.areaCreate.languageLabel
                    }
                  </span>
                  <strong>
                    {
                      language.toUpperCase()
                    }
                  </strong>
                </div>

                <label>
                  <span>
                    {
                      copy.areaCreate.name
                    }
                  </span>
                  <input
                    value={areaName}
                    onChange={(event) =>
                      setAreaName(
                        event.target.value
                      )
                    }
                    maxLength={120}
                    required
                    autoFocus
                  />
                </label>

                <label>
                  <span>
                    {
                      copy.areaCreate.descriptionField
                    }
                  </span>
                  <textarea
                    value={areaDescription}
                    onChange={(event) =>
                      setAreaDescription(
                        event.target.value
                      )
                    }
                    rows={3}
                    maxLength={500}
                  />
                </label>

                <p className="taxonomy-language-help">
                  {
                    copy.areaCreate.languageHelp
                  }
                </p>
              </div>

              <div className="taxonomy-code-preview">
                <div>
                  <span>
                    {
                      copy.areaCreate.canonicalCode
                    }
                  </span>
                  <code>
                    {previewLoading
                      ? copy.areaCreate.generating
                      : areaPreview?.areaCode ??
                        "—"}
                  </code>
                </div>

                <div>
                  <span>
                    {
                      copy.areaCreate.numericCode
                    }
                  </span>
                  <code>
                    {previewLoading
                      ? copy.areaCreate.generating
                      : areaPreview?.numericCode ??
                        "—"}
                  </code>
                </div>

                <p>
                  {
                    copy.areaCreate.codeHelp
                  }
                </p>
              </div>

              {areaFormError && (
                <div className="taxonomy-form-message taxonomy-form-message-error">
                  {areaFormError}
                </div>
              )}

              {areaFormSuccess && (
                <div className="taxonomy-form-message taxonomy-form-message-success">
                  {areaFormSuccess}
                </div>
              )}

              <div className="taxonomy-modal-actions">
                <button
                  type="button"
                  className="taxonomy-secondary-button"
                  onClick={closeNewArea}
                  disabled={savingArea}
                >
                  {
                    copy.areaCreate.cancel
                  }
                </button>

                <button
                  type="submit"
                  className="taxonomy-primary-button"
                  disabled={
                    savingArea ||
                    previewLoading ||
                    !areaPreview ||
                    !areaName.trim() ||
                    !areaName.trim()
                  }
                >
                  {savingArea
                    ? copy.areaCreate.saving
                    : copy.areaCreate.save}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
