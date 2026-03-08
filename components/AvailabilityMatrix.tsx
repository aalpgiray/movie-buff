"use client";

import { ExternalLink, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { StreamingOption } from "@/lib/types";

interface AvailabilityMatrixProps {
	availability: Record<string, StreamingOption[]>;
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
	ad: { name: "Andorra", flag: "AD" },
	ae: { name: "United Arab Emirates", flag: "AE" },
	ar: { name: "Argentina", flag: "AR" },
	at: { name: "Austria", flag: "AT" },
	au: { name: "Australia", flag: "AU" },
	be: { name: "Belgium", flag: "BE" },
	bg: { name: "Bulgaria", flag: "BG" },
	br: { name: "Brazil", flag: "BR" },
	ca: { name: "Canada", flag: "CA" },
	ch: { name: "Switzerland", flag: "CH" },
	cl: { name: "Chile", flag: "CL" },
	co: { name: "Colombia", flag: "CO" },
	cz: { name: "Czech Republic", flag: "CZ" },
	de: { name: "Germany", flag: "DE" },
	dk: { name: "Denmark", flag: "DK" },
	es: { name: "Spain", flag: "ES" },
	fi: { name: "Finland", flag: "FI" },
	fr: { name: "France", flag: "FR" },
	gb: { name: "United Kingdom", flag: "GB" },
	gr: { name: "Greece", flag: "GR" },
	hk: { name: "Hong Kong", flag: "HK" },
	hu: { name: "Hungary", flag: "HU" },
	id: { name: "Indonesia", flag: "ID" },
	ie: { name: "Ireland", flag: "IE" },
	il: { name: "Israel", flag: "IL" },
	in: { name: "India", flag: "IN" },
	it: { name: "Italy", flag: "IT" },
	jp: { name: "Japan", flag: "JP" },
	kr: { name: "South Korea", flag: "KR" },
	mx: { name: "Mexico", flag: "MX" },
	my: { name: "Malaysia", flag: "MY" },
	nl: { name: "Netherlands", flag: "NL" },
	no: { name: "Norway", flag: "NO" },
	nz: { name: "New Zealand", flag: "NZ" },
	pe: { name: "Peru", flag: "PE" },
	ph: { name: "Philippines", flag: "PH" },
	pl: { name: "Poland", flag: "PL" },
	pt: { name: "Portugal", flag: "PT" },
	ro: { name: "Romania", flag: "RO" },
	ru: { name: "Russia", flag: "RU" },
	se: { name: "Sweden", flag: "SE" },
	sg: { name: "Singapore", flag: "SG" },
	th: { name: "Thailand", flag: "TH" },
	tr: { name: "Turkey", flag: "TR" },
	tw: { name: "Taiwan", flag: "TW" },
	ua: { name: "Ukraine", flag: "UA" },
	us: { name: "United States", flag: "US" },
	za: { name: "South Africa", flag: "ZA" },
};

export function AvailabilityMatrix({ availability }: AvailabilityMatrixProps) {
	const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
	const [userCountry, setUserCountry] = useState<string | null>(null);

	useEffect(() => {
		const detectCountry = async () => {
			try {
				const response = await fetch("https://ipapi.co/json/");
				if (response.ok) {
					const data = await response.json();
					if (data.country_code) {
						setUserCountry(data.country_code.toLowerCase());
						return;
					}
				}
			} catch (error) {
				console.warn("Failed to detect country from IP:", error);
			}

			if (typeof window !== "undefined" && navigator.language) {
				const region = navigator.language.split("-")[1];
				if (region) {
					setUserCountry(region.toLowerCase());
				}
			}
		};

		detectCountry();
	}, []);

	const countryLookup = useMemo(() => {
		const map = new Map<string, { name: string; flag: string }>();
		Object.entries(COUNTRY_MAP).forEach(([code, info]) => {
			map.set(code, info);
		});
		return map;
	}, []);

	const { allPlatforms, allCountries } = useMemo(() => {
		const platforms = new Map<string, string>();
		const countries = new Set<string>();

		if (availability) {
			Object.entries(availability).forEach(([countryCode, options]) => {
				countries.add(countryCode);
				if (Array.isArray(options)) {
					options.forEach((opt) => {
						platforms.set(opt.service.id, opt.service.name);
					});
				}
			});
		}

		let sortedCountries = Array.from(countries).sort();

		if (userCountry && countries.has(userCountry)) {
			sortedCountries = [
				userCountry,
				...sortedCountries.filter((c) => c !== userCountry),
			];
		}

		return {
			allPlatforms: Array.from(platforms.entries()).map(([id, name]) => ({
				id,
				name,
			})),
			allCountries: sortedCountries,
		};
	}, [availability, userCountry]);

	useEffect(() => {
		if (selectedPlatforms.length === 0 && allPlatforms.length > 0) {
			const defaults = ["netflix", "prime", "disney", "hbo", "apple"];
			const initial = allPlatforms
				.filter((p) => defaults.includes(p.id))
				.map((p) => p.id);

			if (initial.length === 0) {
				setSelectedPlatforms(allPlatforms.slice(0, 5).map((p) => p.id));
			} else {
				setSelectedPlatforms(initial);
			}
		}
	}, [allPlatforms, selectedPlatforms]);

	if (!availability || Object.keys(availability).length === 0) {
		return (
			<div className="text-sm text-muted-foreground">
				No streaming data available.
			</div>
		);
	}

	const togglePlatform = (id: string) => {
		setSelectedPlatforms((prev) =>
			prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
		);
	};

	const getOptions = (
		countryCode: string,
		platformId: string,
	): StreamingOption[] => {
		const options = availability[countryCode];
		if (!Array.isArray(options)) return [];
		return options.filter((o) => o.service.id === platformId);
	};

	const formatTypes = (options: StreamingOption[]): string => {
		const types = new Set(options.map((o) => o.type));
		const typeLabels: Record<string, string> = {
			subscription: "Stream",
			rent: "Rent",
			buy: "Buy",
			free: "Free",
			addon: "Stream",
		};
		return Array.from(types)
			.map((t) => typeLabels[t] || t)
			.join(" | ");
	};

	return (
		<div className="space-y-6">
			{/* Platform Filter */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Filter className="h-4 w-4" />
						<span>Filter Platforms</span>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{allPlatforms.map((platform) => (
							<Button
								key={platform.id}
								variant={
									selectedPlatforms.includes(platform.id) ? "default" : "outline"
								}
								size="sm"
								onClick={() => togglePlatform(platform.id)}
								className="rounded-full"
							>
								{platform.name}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Matrix — horizontal scroll on the card, vertical scroll via page */}
			<Card className="overflow-x-auto">
				<table className="w-full text-sm text-left border-collapse">
					<thead className="sticky top-14 z-20 bg-card shadow-sm">
						<tr className="border-b border-border">
							<th className="p-4 font-medium text-card-foreground min-w-[150px] bg-card">
								Country
							</th>
							{selectedPlatforms.map((platformId) => {
								const platform = allPlatforms.find((p) => p.id === platformId);
								return (
									<th
										key={platformId}
										className="p-4 font-medium text-center min-w-[120px] bg-card text-card-foreground"
									>
										{platform?.name}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{allCountries.map((countryCode) => {
							const countryInfo = countryLookup.get(countryCode) || {
								name: countryCode.toUpperCase(),
								flag: countryCode.toUpperCase(),
							};

							const isUserCountry = countryCode === userCountry;

							return (
								<tr
									key={countryCode}
									className={cn(
										"transition-colors",
										isUserCountry
											? "bg-primary/5 hover:bg-primary/10"
											: "hover:bg-muted/50",
									)}
								>
									<td className="p-4 font-medium text-foreground">
										<span className="mr-2 text-xs font-bold text-muted-foreground">
											{countryInfo.flag}
										</span>
										{countryInfo.name}
										{isUserCountry && (
											<Badge variant="default" className="ml-2 text-[10px]">
												You
											</Badge>
										)}
									</td>
									{selectedPlatforms.map((platformId) => {
										const options = getOptions(countryCode, platformId);
										const hasOptions = options.length > 0;

										return (
											<td
												key={`${countryCode}-${platformId}`}
												className="p-4 text-center"
											>
												{hasOptions ? (
													<Button
														variant="ghost"
														size="sm"
														asChild
														className="h-auto px-2 py-1 text-xs bg-primary/10 hover:bg-primary hover:text-primary-foreground"
													>
														<a
															href={options[0].link}
															target="_blank"
															rel="noopener noreferrer"
															title={`Watch on ${allPlatforms.find((p) => p.id === platformId)?.name}`}
														>
															<span className="font-medium">
																{formatTypes(options)}
															</span>
															<ExternalLink className="h-3 w-3 ml-1" />
														</a>
													</Button>
												) : (
													<span className="text-muted-foreground/40 block">
														-
													</span>
												)}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>
		</div>
	);
}
