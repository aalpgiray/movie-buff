"use client";

import { clsx } from "clsx";
import { ExternalLink, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface StreamingOption {
	service: { id: string; name: string };
	link: string;
	type: string; // 'subscription' | 'rent' | 'buy' | 'free' | 'addon'
}

interface CountryMetadata {
	countryCode: string;
	name: string;
	flagEmoji: string;
}

interface AvailabilityMatrixProps {
	availability: Record<string, StreamingOption[]>;
	countriesMetadata?: CountryMetadata[];
}

// Comprehensive country mapping as fallback (all countries)
const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
	ad: { name: "Andorra", flag: "🇦🇩" },
	ae: { name: "United Arab Emirates", flag: "🇦🇪" },
	af: { name: "Afghanistan", flag: "🇦🇫" },
	ag: { name: "Antigua and Barbuda", flag: "🇦🇬" },
	ai: { name: "Anguilla", flag: "🇦🇮" },
	al: { name: "Albania", flag: "🇦🇱" },
	am: { name: "Armenia", flag: "🇦🇲" },
	ao: { name: "Angola", flag: "🇦🇴" },
	aq: { name: "Antarctica", flag: "🇦🇶" },
	ar: { name: "Argentina", flag: "🇦🇷" },
	as: { name: "American Samoa", flag: "🇦🇸" },
	at: { name: "Austria", flag: "🇦🇹" },
	au: { name: "Australia", flag: "🇦🇺" },
	aw: { name: "Aruba", flag: "🇦🇼" },
	ax: { name: "Åland Islands", flag: "🇦🇽" },
	az: { name: "Azerbaijan", flag: "🇦🇿" },
	ba: { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
	bb: { name: "Barbados", flag: "🇧🇧" },
	bd: { name: "Bangladesh", flag: "🇧🇩" },
	be: { name: "Belgium", flag: "🇧🇪" },
	bf: { name: "Burkina Faso", flag: "🇧🇫" },
	bg: { name: "Bulgaria", flag: "🇧🇬" },
	bh: { name: "Bahrain", flag: "🇧🇭" },
	bi: { name: "Burundi", flag: "🇧🇮" },
	bj: { name: "Benin", flag: "🇧🇯" },
	bl: { name: "Saint Barthélemy", flag: "🇧🇱" },
	bm: { name: "Bermuda", flag: "🇧🇲" },
	bn: { name: "Brunei", flag: "🇧🇳" },
	bo: { name: "Bolivia", flag: "🇧🇴" },
	bq: { name: "Caribbean Netherlands", flag: "🇧🇶" },
	br: { name: "Brazil", flag: "🇧🇷" },
	bs: { name: "Bahamas", flag: "🇧🇸" },
	bt: { name: "Bhutan", flag: "🇧🇹" },
	bv: { name: "Bouvet Island", flag: "🇧🇻" },
	bw: { name: "Botswana", flag: "🇧🇼" },
	by: { name: "Belarus", flag: "🇧🇾" },
	bz: { name: "Belize", flag: "🇧🇿" },
	ca: { name: "Canada", flag: "🇨🇦" },
	cc: { name: "Cocos Islands", flag: "🇨🇨" },
	cd: { name: "DR Congo", flag: "🇨🇩" },
	cf: { name: "Central African Republic", flag: "🇨🇫" },
	cg: { name: "Republic of the Congo", flag: "🇨🇬" },
	ch: { name: "Switzerland", flag: "🇨🇭" },
	ci: { name: "Côte d'Ivoire", flag: "🇨🇮" },
	ck: { name: "Cook Islands", flag: "🇨🇰" },
	cl: { name: "Chile", flag: "🇨🇱" },
	cm: { name: "Cameroon", flag: "🇨🇲" },
	cn: { name: "China", flag: "🇨🇳" },
	co: { name: "Colombia", flag: "🇨🇴" },
	cr: { name: "Costa Rica", flag: "🇨🇷" },
	cu: { name: "Cuba", flag: "🇨🇺" },
	cv: { name: "Cape Verde", flag: "🇨🇻" },
	cw: { name: "Curaçao", flag: "🇨🇼" },
	cx: { name: "Christmas Island", flag: "🇨🇽" },
	cy: { name: "Cyprus", flag: "🇨🇾" },
	cz: { name: "Czech Republic", flag: "🇨🇿" },
	de: { name: "Germany", flag: "🇩🇪" },
	dj: { name: "Djibouti", flag: "🇩🇯" },
	dk: { name: "Denmark", flag: "🇩🇰" },
	dm: { name: "Dominica", flag: "🇩🇲" },
	do: { name: "Dominican Republic", flag: "🇩🇴" },
	dz: { name: "Algeria", flag: "🇩🇿" },
	ec: { name: "Ecuador", flag: "🇪🇨" },
	ee: { name: "Estonia", flag: "🇪🇪" },
	eg: { name: "Egypt", flag: "🇪🇬" },
	eh: { name: "Western Sahara", flag: "🇪🇭" },
	er: { name: "Eritrea", flag: "🇪🇷" },
	es: { name: "Spain", flag: "🇪🇸" },
	et: { name: "Ethiopia", flag: "🇪🇹" },
	fi: { name: "Finland", flag: "🇫🇮" },
	fj: { name: "Fiji", flag: "🇫🇯" },
	fk: { name: "Falkland Islands", flag: "🇫🇰" },
	fm: { name: "Micronesia", flag: "🇫🇲" },
	fo: { name: "Faroe Islands", flag: "🇫🇴" },
	fr: { name: "France", flag: "🇫🇷" },
	ga: { name: "Gabon", flag: "🇬🇦" },
	gb: { name: "United Kingdom", flag: "🇬🇧" },
	gd: { name: "Grenada", flag: "🇬🇩" },
	ge: { name: "Georgia", flag: "🇬🇪" },
	gf: { name: "French Guiana", flag: "🇬🇫" },
	gg: { name: "Guernsey", flag: "🇬🇬" },
	gh: { name: "Ghana", flag: "🇬🇭" },
	gi: { name: "Gibraltar", flag: "🇬🇮" },
	gl: { name: "Greenland", flag: "🇬🇱" },
	gm: { name: "Gambia", flag: "🇬🇲" },
	gn: { name: "Guinea", flag: "🇬🇳" },
	gp: { name: "Guadeloupe", flag: "🇬🇵" },
	gq: { name: "Equatorial Guinea", flag: "🇬🇶" },
	gr: { name: "Greece", flag: "🇬🇷" },
	gs: { name: "South Georgia", flag: "🇬🇸" },
	gt: { name: "Guatemala", flag: "🇬🇹" },
	gu: { name: "Guam", flag: "🇬🇺" },
	gw: { name: "Guinea-Bissau", flag: "🇬🇼" },
	gy: { name: "Guyana", flag: "🇬🇾" },
	hk: { name: "Hong Kong", flag: "🇭🇰" },
	hm: { name: "Heard Island", flag: "🇭🇲" },
	hn: { name: "Honduras", flag: "🇭🇳" },
	hr: { name: "Croatia", flag: "🇭🇷" },
	ht: { name: "Haiti", flag: "��" },
	hu: { name: "Hungary", flag: "🇭🇺" },
	id: { name: "Indonesia", flag: "🇮🇩" },
	ie: { name: "Ireland", flag: "🇮🇪" },
	il: { name: "Israel", flag: "🇮🇱" },
	im: { name: "Isle of Man", flag: "🇮🇲" },
	in: { name: "India", flag: "🇮🇳" },
	io: { name: "British Indian Ocean Territory", flag: "🇮🇴" },
	iq: { name: "Iraq", flag: "🇮🇶" },
	ir: { name: "Iran", flag: "🇮🇷" },
	is: { name: "Iceland", flag: "🇮🇸" },
	it: { name: "Italy", flag: "🇮🇹" },
	je: { name: "Jersey", flag: "🇯🇪" },
	jm: { name: "Jamaica", flag: "🇯🇲" },
	jo: { name: "Jordan", flag: "🇯🇴" },
	jp: { name: "Japan", flag: "🇯🇵" },
	ke: { name: "Kenya", flag: "🇰🇪" },
	kg: { name: "Kyrgyzstan", flag: "🇰🇬" },
	kh: { name: "Cambodia", flag: "🇰🇭" },
	ki: { name: "Kiribati", flag: "🇰🇮" },
	km: { name: "Comoros", flag: "🇰🇲" },
	kn: { name: "Saint Kitts and Nevis", flag: "🇰🇳" },
	kp: { name: "North Korea", flag: "🇰🇵" },
	kr: { name: "South Korea", flag: "🇰🇷" },
	kw: { name: "Kuwait", flag: "🇰🇼" },
	ky: { name: "Cayman Islands", flag: "🇰🇾" },
	kz: { name: "Kazakhstan", flag: "🇰🇿" },
	la: { name: "Laos", flag: "🇱🇦" },
	lb: { name: "Lebanon", flag: "🇱🇧" },
	lc: { name: "Saint Lucia", flag: "🇱🇨" },
	li: { name: "Liechtenstein", flag: "🇱🇮" },
	lk: { name: "Sri Lanka", flag: "🇱🇰" },
	lr: { name: "Liberia", flag: "🇱🇷" },
	ls: { name: "Lesotho", flag: "🇱🇸" },
	lt: { name: "Lithuania", flag: "🇱🇹" },
	lu: { name: "Luxembourg", flag: "🇱🇺" },
	lv: { name: "Latvia", flag: "🇱🇻" },
	ly: { name: "Libya", flag: "🇱🇾" },
	ma: { name: "Morocco", flag: "🇲🇦" },
	mc: { name: "Monaco", flag: "🇲🇨" },
	md: { name: "Moldova", flag: "🇲🇩" },
	me: { name: "Montenegro", flag: "🇲🇪" },
	mf: { name: "Saint Martin", flag: "🇲🇫" },
	mg: { name: "Madagascar", flag: "🇲🇬" },
	mh: { name: "Marshall Islands", flag: "🇲🇭" },
	mk: { name: "North Macedonia", flag: "🇲🇰" },
	ml: { name: "Mali", flag: "🇲🇱" },
	mm: { name: "Myanmar", flag: "🇲🇲" },
	mn: { name: "Mongolia", flag: "🇲🇳" },
	mo: { name: "Macau", flag: "🇲🇴" },
	mp: { name: "Northern Mariana Islands", flag: "🇲🇵" },
	mq: { name: "Martinique", flag: "🇲🇶" },
	mr: { name: "Mauritania", flag: "🇲🇷" },
	ms: { name: "Montserrat", flag: "🇲🇸" },
	mt: { name: "Malta", flag: "🇲🇹" },
	mu: { name: "Mauritius", flag: "🇲🇺" },
	mv: { name: "Maldives", flag: "🇲🇻" },
	mw: { name: "Malawi", flag: "🇲🇼" },
	mx: { name: "Mexico", flag: "🇲🇽" },
	my: { name: "Malaysia", flag: "🇲🇾" },
	mz: { name: "Mozambique", flag: "🇲🇿" },
	na: { name: "Namibia", flag: "🇳🇦" },
	nc: { name: "New Caledonia", flag: "🇳🇨" },
	ne: { name: "Niger", flag: "🇳🇪" },
	nf: { name: "Norfolk Island", flag: "🇳🇫" },
	ng: { name: "Nigeria", flag: "🇳🇬" },
	ni: { name: "Nicaragua", flag: "🇳🇮" },
	nl: { name: "Netherlands", flag: "🇳🇱" },
	no: { name: "Norway", flag: "🇳🇴" },
	np: { name: "Nepal", flag: "🇳🇵" },
	nr: { name: "Nauru", flag: "🇳🇷" },
	nu: { name: "Niue", flag: "🇳🇺" },
	nz: { name: "New Zealand", flag: "🇳🇿" },
	om: { name: "Oman", flag: "🇴🇲" },
	pa: { name: "Panama", flag: "🇵🇦" },
	pe: { name: "Peru", flag: "🇵🇪" },
	pf: { name: "French Polynesia", flag: "🇵🇫" },
	pg: { name: "Papua New Guinea", flag: "🇵🇬" },
	ph: { name: "Philippines", flag: "🇵🇭" },
	pk: { name: "Pakistan", flag: "🇵🇰" },
	pl: { name: "Poland", flag: "🇵🇱" },
	pm: { name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
	pn: { name: "Pitcairn Islands", flag: "🇵🇳" },
	pr: { name: "Puerto Rico", flag: "🇵🇷" },
	ps: { name: "Palestine", flag: "🇵🇸" },
	pt: { name: "Portugal", flag: "🇵🇹" },
	pw: { name: "Palau", flag: "🇵🇼" },
	py: { name: "Paraguay", flag: "🇵🇾" },
	qa: { name: "Qatar", flag: "🇶🇦" },
	re: { name: "Réunion", flag: "🇷🇪" },
	ro: { name: "Romania", flag: "🇷🇴" },
	rs: { name: "Serbia", flag: "🇷🇸" },
	ru: { name: "Russia", flag: "🇷🇺" },
	rw: { name: "Rwanda", flag: "🇷🇼" },
	sa: { name: "Saudi Arabia", flag: "🇸🇦" },
	sb: { name: "Solomon Islands", flag: "🇸🇧" },
	sc: { name: "Seychelles", flag: "🇸🇨" },
	sd: { name: "Sudan", flag: "🇸🇩" },
	se: { name: "Sweden", flag: "🇸🇪" },
	sg: { name: "Singapore", flag: "🇸🇬" },
	sh: { name: "Saint Helena", flag: "🇸🇭" },
	si: { name: "Slovenia", flag: "🇸🇮" },
	sj: { name: "Svalbard and Jan Mayen", flag: "🇸🇯" },
	sk: { name: "Slovakia", flag: "🇸🇰" },
	sl: { name: "Sierra Leone", flag: "🇸🇱" },
	sm: { name: "San Marino", flag: "🇸🇲" },
	sn: { name: "Senegal", flag: "🇸🇳" },
	so: { name: "Somalia", flag: "🇸🇴" },
	sr: { name: "Suriname", flag: "🇸🇷" },
	ss: { name: "South Sudan", flag: "🇸🇸" },
	st: { name: "São Tomé and Príncipe", flag: "🇸🇹" },
	sv: { name: "El Salvador", flag: "🇸🇻" },
	sx: { name: "Sint Maarten", flag: "🇸🇽" },
	sy: { name: "Syria", flag: "🇸🇾" },
	sz: { name: "Eswatini", flag: "🇸🇿" },
	tc: { name: "Turks and Caicos Islands", flag: "🇹🇨" },
	td: { name: "Chad", flag: "🇹🇩" },
	tf: { name: "French Southern Territories", flag: "🇹🇫" },
	tg: { name: "Togo", flag: "🇹🇬" },
	th: { name: "Thailand", flag: "🇹🇭" },
	tj: { name: "Tajikistan", flag: "🇹🇯" },
	tk: { name: "Tokelau", flag: "🇹🇰" },
	tl: { name: "Timor-Leste", flag: "🇹🇱" },
	tm: { name: "Turkmenistan", flag: "🇹🇲" },
	tn: { name: "Tunisia", flag: "🇹🇳" },
	to: { name: "Tonga", flag: "🇹🇴" },
	tr: { name: "Turkey", flag: "🇹🇷" },
	tt: { name: "Trinidad and Tobago", flag: "🇹🇹" },
	tv: { name: "Tuvalu", flag: "🇹🇻" },
	tw: { name: "Taiwan", flag: "🇹🇼" },
	tz: { name: "Tanzania", flag: "🇹🇿" },
	ua: { name: "Ukraine", flag: "🇺🇦" },
	ug: { name: "Uganda", flag: "🇺🇬" },
	um: { name: "U.S. Minor Outlying Islands", flag: "🇺🇲" },
	us: { name: "United States", flag: "🇺🇸" },
	uy: { name: "Uruguay", flag: "🇺🇾" },
	uz: { name: "Uzbekistan", flag: "🇺🇿" },
	va: { name: "Vatican City", flag: "🇻🇦" },
	vc: { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
	ve: { name: "Venezuela", flag: "🇻🇪" },
	vg: { name: "British Virgin Islands", flag: "🇻🇬" },
	vi: { name: "U.S. Virgin Islands", flag: "🇻🇮" },
	vn: { name: "Vietnam", flag: "🇻🇳" },
	vu: { name: "Vanuatu", flag: "🇻🇺" },
	wf: { name: "Wallis and Futuna", flag: "🇼🇫" },
	ws: { name: "Samoa", flag: "🇼🇸" },
	xk: { name: "Kosovo", flag: "🇽🇰" },
	ye: { name: "Yemen", flag: "🇾🇪" },
	yt: { name: "Mayotte", flag: "🇾🇹" },
	za: { name: "South Africa", flag: "🇿🇦" },
	zm: { name: "Zambia", flag: "🇿🇲" },
	zw: { name: "Zimbabwe", flag: "🇿🇼" },
};

export function AvailabilityMatrix({
	availability,
	countriesMetadata = []
}: AvailabilityMatrixProps) {
	const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
	const [userCountry, setUserCountry] = useState<string | null>(null);

	// Detect user country on mount using IP geolocation
	useEffect(() => {
		const detectCountry = async () => {
			try {
				// Use ipapi.co free tier for IP-based country detection
				const response = await fetch('https://ipapi.co/json/');
				if (response.ok) {
					const data = await response.json();
					if (data.country_code) {
						setUserCountry(data.country_code.toLowerCase());
						return;
					}
				}
			} catch (error) {
				console.warn('Failed to detect country from IP:', error);
			}

			// Fallback to language-based detection
			if (typeof window !== "undefined" && navigator.language) {
				const region = navigator.language.split("-")[1];
				if (region) {
					setUserCountry(region.toLowerCase());
				}
			}
		};

		detectCountry();
	}, []);

	// Create a lookup map for country metadata, merge API data with fallback
	const countryLookup = useMemo(() => {
		const map = new Map<string, { name: string; flag: string }>();

		// First, add all from the fallback map
		Object.entries(COUNTRY_MAP).forEach(([code, info]) => {
			map.set(code, info);
		});

		// Then, override with API metadata if available
		countriesMetadata.forEach(country => {
			map.set(country.countryCode, {
				name: country.name,
				flag: country.flagEmoji
			});
		});

		return map;
	}, [countriesMetadata]);

	// 1. Extract all unique platforms and countries from the data
	const { allPlatforms, allCountries } = useMemo(() => {
		const platforms = new Map<string, string>(); // id -> name
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

		// Move user country to top if exists
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

	// Initialize selected platforms with top 5 or all if fewer
	useMemo(() => {
		if (selectedPlatforms.length === 0 && allPlatforms.length > 0) {
			const defaults = ["netflix", "prime", "disney", "hbo", "apple"];
			const initial = allPlatforms
				.filter((p) => defaults.includes(p.id))
				.map((p) => p.id);

			// If no defaults found, just take the first 5
			if (initial.length === 0) {
				setSelectedPlatforms(allPlatforms.slice(0, 5).map((p) => p.id));
			} else {
				setSelectedPlatforms(initial);
			}
		}
	}, [allPlatforms, selectedPlatforms.length]);

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

	// Helper to get streaming options for a specific platform in a country
	const getOptions = (countryCode: string, platformId: string): StreamingOption[] => {
		const options = availability[countryCode];
		if (!Array.isArray(options)) return [];
		return options.filter((o) => o.service.id === platformId);
	};

	// Helper to format streaming types
	const formatTypes = (options: StreamingOption[]): string => {
		const types = new Set(options.map(o => o.type));
		const typeLabels: Record<string, string> = {
			'subscription': 'Stream',
			'rent': 'Rent',
			'buy': 'Buy',
			'free': 'Free',
			'addon': 'Stream'
		};
		return Array.from(types).map(t => typeLabels[t] || t).join(' | ');
	};

	return (
		<div className="space-y-6">
			{/* Platform Filter */}
			<div className="bg-white/5 rounded-xl p-4 border border-white/10">
				<div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
					<Filter className="h-4 w-4" />
					<span>Filter Platforms</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{allPlatforms.map((platform) => (
						<button
							key={platform.id}
							type="button"
							onClick={() => togglePlatform(platform.id)}
							className={clsx(
								"px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
								selectedPlatforms.includes(platform.id)
									? "bg-primary text-primary-foreground border-primary"
									: "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10",
							)}
						>
							{platform.name}
						</button>
					))}
				</div>
			</div>

			{/* Matrix */}
			<div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 max-h-[500px] relative">
				<table className="w-full text-sm text-left border-collapse">
					<thead className="sticky top-0 z-10 bg-[#0a0a0a] shadow-sm shadow-white/5">
						<tr className="border-b border-white/10">
							<th className="p-4 font-medium text-muted-foreground min-w-[150px] bg-[#0a0a0a]">
								Country
							</th>
							{selectedPlatforms.map((platformId) => {
								const platform = allPlatforms.find((p) => p.id === platformId);
								return (
									<th
										key={platformId}
										className="p-4 font-medium text-center min-w-[120px] bg-[#0a0a0a]"
									>
										{platform?.name}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="divide-y divide-white/5">
						{allCountries.map((countryCode) => {
							// Use API metadata if available, fallback to code
							const countryInfo = countryLookup.get(countryCode) || {
								name: countryCode.toUpperCase(),
								flag: "🌍",
							};

							const isUserCountry = countryCode === userCountry;

							return (
								<tr
									key={countryCode}
									className={clsx(
										"transition-colors",
										isUserCountry
											? "bg-primary/5 hover:bg-primary/10"
											: "hover:bg-white/5",
									)}
								>
									<td className="p-4 font-medium">
										<span className="mr-2 text-lg">{countryInfo.flag}</span>
										{countryInfo.name}
										{isUserCountry && (
											<span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
												You
											</span>
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
													<a
														href={options[0].link}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-primary hover:text-white transition-all group text-xs"
														title={`Watch on ${allPlatforms.find((p) => p.id === platformId)?.name}`}
													>
														<span className="font-medium">{formatTypes(options)}</span>
														<ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
													</a>
												) : (
													<span className="text-muted-foreground/20 block">
														•
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
			</div>
		</div>
	);
}
