// Subtopic-specific overviews for the A-Level Maths curriculum
// These provide detailed introductions when a student selects a specific subtopic

export interface SubtopicOverview {
  title: string;
  description: string;
  keyPoints: string[];
  examTip?: string;
}

// Format: 'topicId:subtopic-name' (lowercase, hyphenated)
export const subtopicOverviews: Record<string, SubtopicOverview> = {
  // === PROOF ===
  'proof:proof-by-deduction': {
    title: 'Proof by Deduction',
    description: 'Proof by deduction uses logical steps to move from known facts (premises) to a conclusion. Each step must follow logically from the previous one, creating an unbreakable chain of reasoning.',
    keyPoints: [
      'Start from definitions, axioms, or previously proven results',
      'Use logical connectives (if...then, and, or, not)',
      'Each step must be justified with a reason',
      'The conclusion must follow necessarily from the premises'
    ],
    examTip: 'Always clearly state your starting point and ensure each step is justified. "Therefore" statements should directly follow from previous lines.'
  },
  'proof:proof-by-exhaustion': {
    title: 'Proof by Exhaustion',
    description: 'Proof by exhaustion involves checking every possible case to verify a statement is true. This method works when the number of cases is finite and manageable.',
    keyPoints: [
      'Identify all possible cases that cover the statement',
      'Verify the statement holds for each case individually',
      'Ensure no cases are missed (cases must be exhaustive)',
      'Commonly used for small sets of integers or categories'
    ],
    examTip: 'Clearly list all cases at the start and tick them off as you verify each one. State explicitly that all cases have been covered.'
  },
  'proof:disproof-by-counter-example': {
    title: 'Disproof by Counter Example',
    description: 'To disprove a universal statement ("for all..."), you only need to find ONE example where it fails. This single counter-example is enough to show the statement is false.',
    keyPoints: [
      'Understand what the statement claims for ALL cases',
      'Find ONE specific example that breaks the claim',
      'Verify your counter-example is valid (meets any conditions)',
      'Clearly state why this disproves the original claim'
    ],
    examTip: 'Choose simple numbers that are easy to verify. Check your counter-example actually satisfies any given conditions.'
  },

  // === ALGEBRA AND FUNCTIONS ===
  'algebra-functions:indices-and-surds': {
    title: 'Indices and Surds',
    description: 'Mastering the laws of indices and manipulating surds are foundational skills for A-Level Maths. These techniques appear throughout calculus, exponentials, and problem-solving.',
    keyPoints: [
      'Laws: aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ',
      'Negative indices: a⁻ⁿ = 1/aⁿ',
      'Fractional indices: a^(1/n) = ⁿ√a, a^(m/n) = ⁿ√(aᵐ)',
      'Rationalising denominators: multiply by conjugate surd'
    ],
    examTip: 'Write fractional powers as roots when simplifying. For rationalising, remember (a+√b)(a-√b) = a² - b.'
  },
  'algebra-functions:quadratic-functions': {
    title: 'Quadratic Functions',
    description: 'Quadratics are polynomials of degree 2, forming parabolas when graphed. Understanding their properties—roots, turning points, and forms—is essential for many A-Level topics.',
    keyPoints: [
      'Standard form: ax² + bx + c, factorised form: a(x-p)(x-q)',
      'Vertex form: a(x-h)² + k where (h,k) is the turning point',
      'Discriminant b² - 4ac determines number of real roots',
      'Completing the square to find vertex and solve equations'
    ],
    examTip: 'Completing the square is often faster than the quadratic formula for finding the turning point.'
  },
  'algebra-functions:equations-and-inequalities': {
    title: 'Equations and Inequalities',
    description: 'Solving equations and inequalities at A-Level extends GCSE skills to include quadratic inequalities, simultaneous equations with curves, and understanding solution sets.',
    keyPoints: [
      'Solve linear and quadratic equations algebraically',
      'Quadratic inequalities: factorise, sketch, identify valid regions',
      'Simultaneous equations: substitution when one equation is non-linear',
      'Interpret inequalities graphically on number lines and coordinate planes'
    ],
    examTip: 'For quadratic inequalities, ALWAYS sketch the parabola to identify the correct region. Don\'t flip the sign unless multiplying by a negative.'
  },
  'algebra-functions:algebraic-manipulation': {
    title: 'Algebraic Manipulation',
    description: 'Fluent algebraic manipulation is the backbone of A-Level Maths. This includes factorising, expanding, simplifying, and working with algebraic fractions.',
    keyPoints: [
      'Factor theorem: (x-a) is a factor iff f(a) = 0',
      'Polynomial division: long division or synthetic division',
      'Algebraic fractions: find common denominators, simplify',
      'Partial fractions for integration preparation'
    ],
    examTip: 'Factor theorem is your friend—test simple values like ±1, ±2 first when factorising cubics.'
  },
  'algebra-functions:graphs-and-transformations': {
    title: 'Graphs and Transformations',
    description: 'Understanding how functions transform graphically allows you to sketch complex curves quickly. Translations, stretches, and reflections follow consistent rules.',
    keyPoints: [
      'f(x) + a: vertical translation up by a',
      'f(x + a): horizontal translation left by a',
      'af(x): vertical stretch scale factor a',
      'f(ax): horizontal stretch scale factor 1/a'
    ],
    examTip: 'Remember: changes INSIDE the bracket affect x (horizontal, opposite direction), OUTSIDE affect y (vertical, intuitive direction).'
  },

  // === COORDINATE GEOMETRY ===
  'coordinate-geometry:straight-lines': {
    title: 'Straight Lines',
    description: 'Coordinate geometry of straight lines connects algebra with geometry. You\'ll work with gradients, equations of lines, and relationships between parallel and perpendicular lines.',
    keyPoints: [
      'Gradient m = (y₂ - y₁)/(x₂ - x₁)',
      'Forms: y = mx + c, y - y₁ = m(x - x₁), ax + by + c = 0',
      'Parallel lines have equal gradients: m₁ = m₂',
      'Perpendicular lines: m₁ × m₂ = -1'
    ],
    examTip: 'y - y₁ = m(x - x₁) is often the fastest form to use when you know a point and gradient.'
  },
  'coordinate-geometry:circles': {
    title: 'Circles',
    description: 'Circle geometry combines algebraic equations with geometric properties. You\'ll work with circle equations, tangents, and intersections with lines.',
    keyPoints: [
      'Standard form: (x-a)² + (y-b)² = r², centre (a,b), radius r',
      'Expanded form: x² + y² + 2gx + 2fy + c = 0',
      'Tangent at point is perpendicular to radius at that point',
      'Find intersections by substituting line into circle equation'
    ],
    examTip: 'Complete the square to convert expanded form to standard form. This reveals the centre and radius immediately.'
  },
  'coordinate-geometry:parametric-equations': {
    title: 'Parametric Equations',
    description: 'Parametric equations express x and y separately in terms of a third variable (parameter), usually t. This allows representation of curves that aren\'t functions.',
    keyPoints: [
      'x = f(t), y = g(t) defines a curve parametrically',
      'Convert to Cartesian by eliminating the parameter t',
      'Gradient dy/dx = (dy/dt)/(dx/dt) using chain rule',
      'Common parametric forms for circles, parabolas, and trig curves'
    ],
    examTip: 'When eliminating t, look for identities (especially trig: sin²t + cos²t = 1) or simple algebraic substitutions.'
  },

  // === SEQUENCES AND SERIES ===
  'sequences-series:arithmetic-sequences': {
    title: 'Arithmetic Sequences',
    description: 'Arithmetic sequences have a constant difference between consecutive terms. They model linear growth and appear in financial mathematics and pattern problems.',
    keyPoints: [
      'nth term: aₙ = a + (n-1)d where a is first term, d is common difference',
      'Sum of n terms: Sₙ = n/2(2a + (n-1)d) or Sₙ = n/2(a + l)',
      'Common difference d = aₙ₊₁ - aₙ (constant)',
      'Applications in real-world linear patterns'
    ],
    examTip: 'When given two terms, set up simultaneous equations to find a and d. Always check your formula by calculating the first few terms.'
  },
  'sequences-series:geometric-sequences': {
    title: 'Geometric Sequences',
    description: 'Geometric sequences have a constant ratio between consecutive terms. They model exponential growth/decay and are crucial for compound interest and population models.',
    keyPoints: [
      'nth term: aₙ = arⁿ⁻¹ where a is first term, r is common ratio',
      'Sum of n terms: Sₙ = a(1-rⁿ)/(1-r) or a(rⁿ-1)/(r-1)',
      'Sum to infinity (|r| < 1): S∞ = a/(1-r)',
      'Convergent when |r| < 1, divergent when |r| ≥ 1'
    ],
    examTip: 'For sum to infinity, check |r| < 1 first. If r is negative, the terms alternate in sign.'
  },
  'sequences-series:sigma-notation': {
    title: 'Sigma Notation',
    description: 'Sigma (Σ) notation provides a compact way to write sums. Understanding how to interpret and manipulate sigma notation is essential for series work.',
    keyPoints: [
      'Σ from r=1 to n of f(r) means sum f(1) + f(2) + ... + f(n)',
      'Standard results: Σr = n(n+1)/2, Σr² = n(n+1)(2n+1)/6',
      'Σ(ar + b) = aΣr + bn (linearity)',
      'Splitting and combining sums'
    ],
    examTip: 'Memorise the standard results for Σr and Σr². They save significant time in exams.'
  },
  'sequences-series:binomial-expansion': {
    title: 'Binomial Expansion',
    description: 'The binomial expansion gives a formula for (a+b)ⁿ. For positive integer n, it\'s finite; for other n, it\'s an infinite series with convergence conditions.',
    keyPoints: [
      '(a+b)ⁿ = Σ ⁿCᵣ aⁿ⁻ʳ bʳ for positive integer n',
      'ⁿCᵣ = n!/(r!(n-r)!) are binomial coefficients',
      '(1+x)ⁿ expansion for any n: 1 + nx + n(n-1)x²/2! + ...',
      'Converges when |x| < 1 for non-integer n'
    ],
    examTip: 'Extract factors to get (1 + something)ⁿ form before expanding. State the validity condition for the expansion.'
  },

  // === TRIGONOMETRY ===
  'trigonometry:radian-measure': {
    title: 'Radian Measure',
    description: 'Radians are the natural unit for angles in calculus. One radian is the angle subtended by an arc equal in length to the radius.',
    keyPoints: [
      'π radians = 180°, so 1 radian ≈ 57.3°',
      'Arc length s = rθ (θ in radians)',
      'Sector area A = ½r²θ (θ in radians)',
      'Key values: π/6 = 30°, π/4 = 45°, π/3 = 60°, π/2 = 90°'
    ],
    examTip: 'Always check if your calculator is in radians or degrees. In calculus, radians are essential.'
  },
  'trigonometry:trigonometric-identities': {
    title: 'Trigonometric Identities',
    description: 'Trig identities are equations true for all valid angles. They\'re essential for simplifying expressions, solving equations, and integration.',
    keyPoints: [
      'Pythagorean: sin²θ + cos²θ = 1, tan²θ + 1 = sec²θ',
      'Double angle: sin2θ = 2sinθcosθ, cos2θ = cos²θ - sin²θ',
      'Addition: sin(A±B), cos(A±B), tan(A±B) formulas',
      'R-formula: asinθ + bcosθ = Rsin(θ + α)'
    ],
    examTip: 'The R-formula is crucial for solving asinθ + bcosθ = c. Always find R = √(a² + b²) first.'
  },
  'trigonometry:solving-trig-equations': {
    title: 'Solving Trigonometric Equations',
    description: 'Solving trig equations requires finding all solutions within a given range. Understanding the periodic nature of trig functions is key.',
    keyPoints: [
      'Find the principal value first using inverse trig',
      'Use CAST diagram or symmetry for additional solutions',
      'Period of sin/cos is 2π, period of tan is π',
      'Factorise when equation has multiple trig terms'
    ],
    examTip: 'Always list ALL solutions in the given range. Draw a quick CAST diagram to avoid missing solutions.'
  },
  'trigonometry:reciprocal-functions': {
    title: 'Reciprocal Trig Functions',
    description: 'Secant, cosecant, and cotangent are the reciprocals of cosine, sine, and tangent respectively. They extend your toolkit for solving equations and identities.',
    keyPoints: [
      'secθ = 1/cosθ, cosecθ = 1/sinθ, cotθ = 1/tanθ = cosθ/sinθ',
      'Graphs: asymptotes where the original function equals zero',
      'Identity: 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ',
      'Useful for certain integrals and differential equations'
    ],
    examTip: 'When solving equations, consider converting to sin and cos if stuck. The identities are derived from sin²θ + cos²θ = 1.'
  },
  'trigonometry:inverse-trig-functions': {
    title: 'Inverse Trig Functions',
    description: 'Arcsin, arccos, and arctan are the inverse functions of sin, cos, and tan (with restricted domains). They\'re essential for solving trig equations.',
    keyPoints: [
      'arcsin: domain [-1,1], range [-π/2, π/2]',
      'arccos: domain [-1,1], range [0, π]',
      'arctan: domain ℝ, range (-π/2, π/2)',
      'Derivatives: d/dx(arcsin x) = 1/√(1-x²)'
    ],
    examTip: 'Remember the restricted ranges! arcsin and arctan give values in quadrants 1 and 4, arccos in quadrants 1 and 2.'
  },

  // === EXPONENTIALS AND LOGARITHMS ===
  'exponentials-logarithms:laws-of-logarithms': {
    title: 'Laws of Logarithms',
    description: 'Logarithms are the inverse of exponentials. The log laws mirror the index laws and are essential for solving exponential equations.',
    keyPoints: [
      'log(ab) = log a + log b (product rule)',
      'log(a/b) = log a - log b (quotient rule)',
      'log(aⁿ) = n log a (power rule)',
      'Change of base: logₐb = logc b / logc a'
    ],
    examTip: 'When simplifying logs, bring powers down FIRST, then combine using product/quotient rules.'
  },
  'exponentials-logarithms:exponential-equations': {
    title: 'Exponential Equations',
    description: 'Exponential equations have the variable in the exponent. Logarithms are the key tool for solving them.',
    keyPoints: [
      'If aˣ = b, then x = logₐ b = (ln b)/(ln a)',
      'For equations with same base: if aˣ = aʸ, then x = y',
      'Substitution for equations like a²ˣ - 5aˣ + 6 = 0',
      'e and natural logarithms: if eˣ = k, then x = ln k'
    ],
    examTip: 'Check for "quadratic in disguise" when you see terms like 4ˣ and 2ˣ (since 4ˣ = (2²)ˣ = (2ˣ)²).'
  },
  'exponentials-logarithms:natural-logarithm': {
    title: 'The Natural Logarithm',
    description: 'The natural logarithm ln uses base e ≈ 2.718. It\'s "natural" because d/dx(eˣ) = eˣ and d/dx(ln x) = 1/x, making calculus elegant.',
    keyPoints: [
      'ln x = logₑ x, and eˡⁿˣ = x, ln(eˣ) = x',
      'd/dx(eˣ) = eˣ, d/dx(ln x) = 1/x',
      '∫eˣ dx = eˣ + C, ∫(1/x) dx = ln|x| + C',
      'All log laws apply to ln'
    ],
    examTip: 'Use ln for calculus problems. Convert other bases using aˣ = eˣˡⁿᵃ when differentiating or integrating.'
  },
  'exponentials-logarithms:exponential-modelling': {
    title: 'Exponential Modelling',
    description: 'Exponential functions model growth and decay in real-world contexts: populations, radioactive decay, cooling, compound interest, and more.',
    keyPoints: [
      'Growth: y = Aeᵏᵗ (k > 0), Decay: y = Ae⁻ᵏᵗ (k > 0)',
      'Half-life: time for quantity to halve, T = ln2/k',
      'Doubling time: T = ln2/k for growth',
      'Fitting models: take logs to create linear relationships'
    ],
    examTip: 'When given data points, substitute to create equations and solve for constants. Always state what your variables represent.'
  },

  // === DIFFERENTIATION ===
  'differentiation:first-principles': {
    title: 'Differentiation from First Principles',
    description: 'First principles derives the gradient function using the limit of (f(x+h) - f(x))/h as h → 0. This foundation explains why differentiation rules work.',
    keyPoints: [
      'f\'(x) = lim(h→0) [f(x+h) - f(x)]/h',
      'This gives the instantaneous rate of change',
      'Derive standard results: d/dx(xⁿ) = nxⁿ⁻¹',
      'Understanding leads to the product and chain rules'
    ],
    examTip: 'Expand f(x+h) carefully, cancel terms, then take the limit. Show each algebraic step clearly.'
  },
  'differentiation:chain-rule': {
    title: 'The Chain Rule',
    description: 'The chain rule differentiates composite functions (functions of functions). If y = f(g(x)), then dy/dx = f\'(g(x)) × g\'(x).',
    keyPoints: [
      'dy/dx = dy/du × du/dx (chain rule)',
      'Differentiate outer function, keep inner, multiply by inner\'s derivative',
      'Works for any composite function',
      'Essential for differentiating (...)ⁿ, trig(f(x)), eᶠ⁽ˣ⁾, ln(f(x))'
    ],
    examTip: 'Practice until it\'s automatic. For (ax+b)ⁿ, the answer is n(ax+b)ⁿ⁻¹ × a.'
  },
  'differentiation:product-rule': {
    title: 'The Product Rule',
    description: 'The product rule differentiates products of functions. If y = uv, then dy/dx = u(dv/dx) + v(du/dx).',
    keyPoints: [
      'd/dx(uv) = u(dv/dx) + v(du/dx)',
      'Remember as "first times derivative of second plus second times derivative of first"',
      'Often combined with chain rule',
      'Useful for x·eˣ, x·sin x, x·ln x type functions'
    ],
    examTip: 'Identify u and v clearly before starting. Simplify your final answer by factorising where possible.'
  },
  'differentiation:quotient-rule': {
    title: 'The Quotient Rule',
    description: 'The quotient rule differentiates fractions of functions. If y = u/v, then dy/dx = (v·du/dx - u·dv/dx)/v².',
    keyPoints: [
      'd/dx(u/v) = (v(du/dx) - u(dv/dx))/v²',
      'Remember: "low d-high minus high d-low, over low squared"',
      'Alternative: rewrite as u·v⁻¹ and use product rule',
      'Often produces factorisable expressions'
    ],
    examTip: 'The quotient rule often produces complex expressions. Look to factorise the numerator to simplify.'
  },
  'differentiation:implicit-differentiation': {
    title: 'Implicit Differentiation',
    description: 'When y cannot be easily isolated (e.g., x² + y² = 25), differentiate both sides with respect to x, treating y as a function of x.',
    keyPoints: [
      'Differentiate each term with respect to x',
      'When differentiating y terms, use chain rule: d/dx(yⁿ) = n·yⁿ⁻¹·(dy/dx)',
      'Collect dy/dx terms and solve',
      'Used for circles, ellipses, and curves where y = f(x) isn\'t explicit'
    ],
    examTip: 'Don\'t forget to multiply by dy/dx every time you differentiate a y term. This is where most errors occur.'
  },
  'differentiation:applications': {
    title: 'Applications of Differentiation',
    description: 'Differentiation has many applications: finding tangents and normals, locating stationary points, optimisation, and rates of change.',
    keyPoints: [
      'Tangent gradient = f\'(a) at x = a',
      'Normal gradient = -1/f\'(a) (perpendicular)',
      'Stationary points where f\'(x) = 0; classify using f\'\'(x)',
      'Optimisation: find max/min by solving f\'(x) = 0'
    ],
    examTip: 'For optimisation, set up the function to maximise/minimise clearly, find f\'(x), solve f\'(x) = 0, then verify it\'s a max or min.'
  },

  // === INTEGRATION ===
  'integration:standard-integrals': {
    title: 'Standard Integrals',
    description: 'Integration is the reverse of differentiation. Learning standard integrals fluently is essential for more complex techniques.',
    keyPoints: [
      '∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1)',
      '∫eˣ dx = eˣ + C, ∫1/x dx = ln|x| + C',
      '∫sin x dx = -cos x + C, ∫cos x dx = sin x + C',
      'Always include + C for indefinite integrals'
    ],
    examTip: 'Check your answer by differentiating. If you get back the original, you\'ve integrated correctly.'
  },
  'integration:integration-by-substitution': {
    title: 'Integration by Substitution',
    description: 'Substitution reverses the chain rule. When you spot a composite function, let u equal the inner function and transform the integral.',
    keyPoints: [
      'Let u = g(x), so du = g\'(x) dx',
      'Substitute to get integral entirely in terms of u',
      'Integrate with respect to u',
      'Substitute back to x (for indefinite) or change limits (for definite)'
    ],
    examTip: 'Look for f(g(x))·g\'(x) patterns. The substitution u = g(x) will simplify these perfectly.'
  },
  'integration:integration-by-parts': {
    title: 'Integration by Parts',
    description: 'Integration by parts reverses the product rule: ∫u dv = uv - ∫v du. Choose u and dv wisely using LIATE.',
    keyPoints: [
      '∫u dv = uv - ∫v du',
      'LIATE priority for choosing u: Logs, Inverse trig, Algebraic, Trig, Exponential',
      'Sometimes need to apply twice',
      'For ∫eˣsin x dx, apply twice and solve the resulting equation'
    ],
    examTip: 'Choose u as the function that becomes simpler when differentiated. For ∫x·eˣ dx, u = x is the right choice.'
  },
  'integration:partial-fractions': {
    title: 'Partial Fractions',
    description: 'Partial fractions decompose algebraic fractions into simpler parts that can be integrated individually using standard results.',
    keyPoints: [
      'Linear factors: A/(x-a) + B/(x-b)',
      'Repeated linear: A/(x-a) + B/(x-a)²',
      'Irreducible quadratic: (Ax+B)/(x²+px+q)',
      'Use cover-up method or equate coefficients'
    ],
    examTip: 'The cover-up method is fastest for distinct linear factors. For repeated factors, equate coefficients systematically.'
  },
  'integration:definite-integrals': {
    title: 'Definite Integrals and Areas',
    description: 'Definite integrals calculate exact areas under curves. The integral from a to b gives the signed area between the curve and the x-axis.',
    keyPoints: [
      '∫ₐᵇ f(x) dx = [F(x)]ₐᵇ = F(b) - F(a)',
      'Areas below x-axis give negative values',
      'For total area, split at roots and take absolute values',
      'Area between curves: ∫(upper - lower) dx'
    ],
    examTip: 'Sketch the curve to identify regions above and below the axis. Split integrals at x-intercepts for total area.'
  },
  'integration:differential-equations': {
    title: 'Differential Equations',
    description: 'Differential equations contain derivatives and model real-world change. First-order separable equations are solved by integrating both sides.',
    keyPoints: [
      'Separate variables: get all y terms with dy, all x terms with dx',
      'Integrate both sides',
      'Apply initial conditions to find the constant C',
      'Model growth, decay, cooling, population dynamics'
    ],
    examTip: 'Always check your solution by differentiating and substituting back into the original equation.'
  },

  // === NUMERICAL METHODS ===
  'numerical-methods:location-of-roots': {
    title: 'Location of Roots',
    description: 'When equations cannot be solved algebraically, numerical methods locate roots. The change of sign method identifies intervals containing roots.',
    keyPoints: [
      'If f(a) and f(b) have opposite signs and f is continuous, there\'s a root between a and b',
      'Interval bisection: repeatedly halve the interval',
      'Linear interpolation: estimate root position proportionally',
      'Decimal search: narrow down digit by digit'
    ],
    examTip: 'Show the sign change clearly: "f(1.2) = -0.3 < 0 and f(1.3) = 0.2 > 0, so there is a root in (1.2, 1.3)".'
  },
  'numerical-methods:newton-raphson-method': {
    title: 'Newton-Raphson Method',
    description: 'Newton-Raphson uses tangent lines to converge rapidly to roots. Each iteration improves the estimate using xₙ₊₁ = xₙ - f(xₙ)/f\'(xₙ).',
    keyPoints: [
      'Formula: xₙ₊₁ = xₙ - f(xₙ)/f\'(xₙ)',
      'Requires a good starting estimate x₀',
      'Converges quadratically (fast) when it works',
      'Can fail if f\'(xₙ) ≈ 0 or starting point is poor'
    ],
    examTip: 'Set up a table showing n, xₙ, f(xₙ), f\'(xₙ), and xₙ₊₁. This organises your working and avoids errors.'
  },
  'numerical-methods:trapezium-rule': {
    title: 'The Trapezium Rule',
    description: 'The trapezium rule approximates definite integrals using trapeziums. It\'s useful when functions cannot be integrated analytically.',
    keyPoints: [
      'Formula: ∫ₐᵇ f(x) dx ≈ h/2[y₀ + 2(y₁ + y₂ + ... + yₙ₋₁) + yₙ]',
      'h = (b-a)/n is the strip width, n is number of strips',
      'More strips generally gives better accuracy',
      'Overestimates convex curves, underestimates concave curves'
    ],
    examTip: 'Set up a table of x and y values first. Count your y values: first and last have coefficient 1, all others have coefficient 2.'
  },

  // === VECTORS ===
  'vectors:vector-basics': {
    title: 'Vector Basics',
    description: 'Vectors have both magnitude and direction. They\'re represented as column vectors or using i, j, k notation and can be added, subtracted, and scaled.',
    keyPoints: [
      'Column vector (x, y, z) or xi + yj + zk notation',
      'Magnitude |a| = √(x² + y² + z²)',
      'Unit vector: a/|a| has magnitude 1',
      'Addition: head to tail, or add components'
    ],
    examTip: 'Position vectors give locations relative to origin. Displacement vectors give direction between two points: AB = b - a.'
  },
  'vectors:scalar-product': {
    title: 'Scalar (Dot) Product',
    description: 'The scalar product a·b gives a scalar result and is used to find angles between vectors. Perpendicular vectors have zero scalar product.',
    keyPoints: [
      'a·b = |a||b|cosθ = x₁x₂ + y₁y₂ + z₁z₂',
      'Perpendicular vectors: a·b = 0',
      'Parallel vectors: a·b = |a||b|',
      'Angle: cosθ = (a·b)/(|a||b|)'
    ],
    examTip: 'To show vectors are perpendicular, calculate the scalar product. If it equals zero, they\'re perpendicular.'
  },
  'vectors:vector-equations-of-lines': {
    title: 'Vector Equations of Lines',
    description: 'Lines in 2D and 3D can be expressed in vector form: r = a + λd, where a is a position vector on the line and d is the direction vector.',
    keyPoints: [
      'r = a + λd (a is a point, d is direction, λ is parameter)',
      'Direction vector from two points: d = b - a',
      'Parallel lines have parallel direction vectors',
      'To find intersections, equate and solve for λ and μ'
    ],
    examTip: 'When checking if lines intersect, solve for both parameters and check they give the same point. In 3D, lines can be skew (neither parallel nor intersecting).'
  },

  // === STATISTICS ===
  'statistical-sampling:sampling-methods': {
    title: 'Sampling Methods',
    description: 'Sampling allows us to learn about populations without measuring everyone. Different methods have different advantages and potential biases.',
    keyPoints: [
      'Random sampling: every member has equal chance',
      'Systematic sampling: select every kth member',
      'Stratified sampling: proportional representation of subgroups',
      'Opportunity/convenience sampling: biased but practical'
    ],
    examTip: 'Explain WHY a method is appropriate for the context. Stratified sampling is best when there are distinct subgroups.'
  },
  'data-presentation:measures-of-location': {
    title: 'Measures of Location and Spread',
    description: 'Measures of location (mean, median, mode) describe the centre; measures of spread (range, IQR, standard deviation) describe variability.',
    keyPoints: [
      'Mean: sum of values divided by number of values',
      'Median: middle value when data is ordered',
      'Standard deviation: measures spread around the mean',
      'For grouped data, use midpoints and frequency'
    ],
    examTip: 'For skewed data, median and IQR are more representative than mean and standard deviation.'
  },
  'data-presentation:histograms-and-box-plots': {
    title: 'Histograms and Box Plots',
    description: 'Histograms display continuous data using frequency density. Box plots show the five-number summary and help compare distributions.',
    keyPoints: [
      'Frequency density = frequency ÷ class width',
      'Area of bar represents frequency',
      'Box plot shows: min, Q1, median, Q3, max',
      'Outliers: below Q1 - 1.5×IQR or above Q3 + 1.5×IQR'
    ],
    examTip: 'When comparing distributions, comment on centre (medians), spread (IQRs), and skewness.'
  },
  'probability:probability-distributions': {
    title: 'Probability Distributions',
    description: 'A probability distribution gives all possible outcomes and their probabilities. Discrete distributions have specific values; continuous have ranges.',
    keyPoints: [
      'Sum of all probabilities equals 1',
      'Expected value E(X) = Σx·P(X=x)',
      'Variance Var(X) = E(X²) - [E(X)]²',
      'Standard deviation σ = √Var(X)'
    ],
    examTip: 'For E(X²), find Σx²·P(X=x) first, not [E(X)]². This is a common error.'
  },
  'probability:binomial-distribution': {
    title: 'Binomial Distribution',
    description: 'The binomial distribution models the number of successes in n independent trials, each with probability p of success.',
    keyPoints: [
      'Conditions: fixed n, constant p, independent trials, two outcomes',
      'P(X = r) = ⁿCᵣ × pʳ × (1-p)ⁿ⁻ʳ',
      'E(X) = np, Var(X) = np(1-p)',
      'Use tables or calculator for cumulative probabilities'
    ],
    examTip: 'Check all four conditions are met before using binomial. "Without replacement" usually means binomial doesn\'t apply.'
  },
  'probability:normal-distribution': {
    title: 'Normal Distribution',
    description: 'The normal distribution is a continuous bell-shaped curve, defined by mean μ and standard deviation σ. Many real-world quantities follow it approximately.',
    keyPoints: [
      'Symmetric about the mean μ',
      'Standardise: Z = (X - μ)/σ converts to N(0,1)',
      'Use standard normal tables or calculator',
      '68-95-99.7 rule for quick estimates'
    ],
    examTip: 'Always sketch and shade the required area. Convert to Z before using tables. For "greater than", use 1 - P(Z < z).'
  },
  'hypothesis-testing:hypothesis-tests': {
    title: 'Hypothesis Testing',
    description: 'Hypothesis testing uses sample data to decide whether to reject a claim about a population. We control the probability of wrongly rejecting a true claim.',
    keyPoints: [
      'H₀: null hypothesis (the claim to test)',
      'H₁: alternative hypothesis (what we suspect)',
      'Significance level α: probability of Type I error',
      'Reject H₀ if test statistic is in the critical region'
    ],
    examTip: 'Always state H₀ and H₁, find the critical region, compare your test value, and give your conclusion IN CONTEXT.'
  },
  'hypothesis-testing:correlation-and-regression': {
    title: 'Correlation and Regression',
    description: 'Correlation measures the strength of linear relationship; regression gives the equation of the line of best fit for making predictions.',
    keyPoints: [
      'PMCC r: -1 ≤ r ≤ 1, measures linear correlation strength',
      'Regression line y = a + bx for predicting y from x',
      'Only interpolate (within data range), not extrapolate',
      'Correlation does not imply causation'
    ],
    examTip: 'Interpolation is reliable; extrapolation is risky. Comment on the strength of correlation when making predictions.'
  },

  // === MECHANICS ===
  'kinematics:suvat-equations': {
    title: 'SUVAT Equations',
    description: 'The SUVAT equations describe motion under constant acceleration. Each equation relates different combinations of displacement, velocity, acceleration, and time.',
    keyPoints: [
      'v = u + at (no s)',
      's = ut + ½at² (no v)',
      's = vt - ½at² (no u)',
      'v² = u² + 2as (no t)',
      's = ½(u + v)t (no a)'
    ],
    examTip: 'Choose your equation based on what you know and what you need. Three known values is usually enough.'
  },
  'kinematics:velocity-time-graphs': {
    title: 'Velocity-Time Graphs',
    description: 'Velocity-time graphs visually represent motion. Gradient gives acceleration; area under the curve gives displacement.',
    keyPoints: [
      'Gradient = acceleration (constant if straight line)',
      'Area under graph = displacement',
      'Horizontal line = constant velocity',
      'Line crossing time axis = direction reversal'
    ],
    examTip: 'Split complex graphs into sections. Calculate areas as triangles, rectangles, or trapeziums.'
  },
  'forces-newtons-laws:force-diagrams': {
    title: 'Force Diagrams',
    description: 'Force diagrams show all forces acting on an object. They\'re essential for applying Newton\'s laws correctly.',
    keyPoints: [
      'Weight: W = mg (always downward)',
      'Normal reaction: perpendicular to surface',
      'Tension: along rope/string, away from object',
      'Friction: opposes motion, along surface'
    ],
    examTip: 'Draw a large, clear diagram. Label every force with its value or symbol. Include the direction of positive.'
  },
  'forces-newtons-laws:applying-f-equals-ma': {
    title: 'Applying F = ma',
    description: 'Newton\'s second law F = ma relates resultant force, mass, and acceleration. Resolve forces into components and apply along each direction.',
    keyPoints: [
      'Resultant force = ma (Newton\'s second law)',
      'Resolve forces into perpendicular components',
      'Equilibrium: resultant force = 0, so a = 0',
      'Connected particles: treat as system or separately'
    ],
    examTip: 'Define positive direction clearly. For connected particles, the acceleration is the same for both (if string is taut).'
  },
  'forces-newtons-laws:connected-particles': {
    title: 'Connected Particles and Pulleys',
    description: 'Connected particle problems involve objects linked by strings over pulleys. The key is that tension is the same throughout and acceleration magnitude is shared.',
    keyPoints: [
      'Light string: tension is equal throughout',
      'Inextensible string: accelerations have equal magnitude',
      'Smooth pulley: tension unchanged across pulley',
      'Write F = ma for each particle separately'
    ],
    examTip: 'If particles move in opposite directions, their accelerations are equal in magnitude but opposite in your equations.'
  },
  'projectiles:projectile-motion': {
    title: 'Projectile Motion',
    description: 'Projectiles follow parabolic paths under gravity alone. Analyse by separating horizontal (constant velocity) and vertical (constant acceleration g) motion.',
    keyPoints: [
      'Horizontal: x = ut cos θ, velocity constant',
      'Vertical: y = ut sin θ - ½gt², acceleration = -g',
      'Time of flight: set y = 0 and solve for t',
      'Range: horizontal distance when y returns to launch height'
    ],
    examTip: 'Horizontal and vertical are independent. Time connects them. Maximum height occurs when vertical velocity = 0.'
  },
  'projectiles:trajectory-equations': {
    title: 'Trajectory and Range',
    description: 'The trajectory equation gives y as a function of x, eliminating time. Maximum range on level ground occurs at 45° launch angle.',
    keyPoints: [
      'Trajectory: y = x tan θ - gx²/(2u² cos² θ)',
      'Maximum height: H = u² sin² θ/(2g)',
      'Range: R = u² sin 2θ/g (on level ground)',
      'Maximum range at θ = 45°'
    ],
    examTip: 'The trajectory equation is useful for finding the angle to clear an obstacle at known (x, y).'
  },
  'moments:calculating-moments': {
    title: 'Calculating Moments',
    description: 'The moment of a force about a point is force × perpendicular distance. Moments cause rotation; equilibrium requires moments to balance.',
    keyPoints: [
      'Moment = Force × perpendicular distance from pivot',
      'Clockwise vs anticlockwise (choose sign convention)',
      'For equilibrium: sum of moments about any point = 0',
      'Also need resultant force = 0 for full equilibrium'
    ],
    examTip: 'Take moments about a point where an unknown force acts—this eliminates it from your equation.'
  },
  'moments:equilibrium-of-rigid-bodies': {
    title: 'Equilibrium of Rigid Bodies',
    description: 'Rigid bodies in equilibrium require both zero resultant force and zero resultant moment. Problems include beams, ladders, and hinged structures.',
    keyPoints: [
      'Sum of forces in any direction = 0',
      'Sum of moments about any point = 0',
      'Non-uniform rods: weight acts at centre of mass',
      'Ladder problems: friction and normal reaction at both ends'
    ],
    examTip: 'For ladder problems, take moments about the base to eliminate the friction and normal reaction at the ground.'
  }
};

// Generate a key for subtopic lookup
export const getSubtopicKey = (topicId: string, subtopicName: string): string => {
  const normalizedSubtopic = subtopicName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${topicId}:${normalizedSubtopic}`;
};

// Get subtopic overview with fallback matching
export const getSubtopicOverview = (topicId: string, subtopicName: string): SubtopicOverview | null => {
  const key = getSubtopicKey(topicId, subtopicName);
  
  // Try exact match first
  if (subtopicOverviews[key]) {
    return subtopicOverviews[key];
  }
  
  // Try to find a close match (handles slight variations in subtopic names)
  const normalizedSearch = key.toLowerCase();
  for (const [existingKey, overview] of Object.entries(subtopicOverviews)) {
    if (existingKey.toLowerCase() === normalizedSearch) {
      return overview;
    }
    // Partial match: if the subtopic portion contains the search
    const [, subtopicPart] = existingKey.split(':');
    const [, searchSubtopic] = normalizedSearch.split(':');
    if (subtopicPart && searchSubtopic && 
        (subtopicPart.includes(searchSubtopic) || searchSubtopic.includes(subtopicPart))) {
      return overview;
    }
  }
  
  return null;
};
