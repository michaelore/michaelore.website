# This code computes the PMF and mode of the sample mean of
# the St. Petersburg paradox distribution.
# https://en.wikipedia.org/wiki/St._Petersburg_paradox

# Compute sample means for 2^0, 2^1, ..., 2^maxk
maxk = 6

from fractions import *

# pmf for original petersburg distribution
# only non-zero when x = 2^n for some int n
def peterprob(x):
    bin_list = '{0:08b}'.format(x)
    if (bin_list.count('1') != 1):
        return Fraction(0, 1)
    else:
        ix = bin_list.index('1')
        if (ix == len(bin_list)-1):
            return Fraction(0, 1)
        n = len(bin_list)-ix-1
        return Fraction(1, 2)**n

# pmf for sum of 2^k petersburgs
# uses memoizing
peter_memo = {}
def peterext(x, k):
    if (x % 2 == 1):
        return Fraction(0, 1)
    if (x, k) in peter_memo:
        return peter_memo[(x, k)]
    if (k == 0):
        prob = peterprob(x)
        peter_memo[(x, k)] = prob
        return prob
    prob = Fraction(0, 1)
    for n in range(x/2):
        m = x-n
        prob += 2*peterext(n, k-1)*peterext(m, k-1)
    prob += peterext(x/2, k-1)**2
    peter_memo[(x, k)] = prob
    return prob

# finds mode of sample mean pmf by checking all n up to 2^maxk
def findmode(k, maxk):
    maxix = 0
    maxprob = Fraction(0, 1)

    # search limit chosen fairly arbitrarily
    # I'm not certain it's far enough for largest k's
    for i in range(16<<maxk):
        ix = Fraction(i, 2**k)
        prob = peterext(i, k)
        if (prob > maxprob):
            maxix = ix
            maxprob = prob
        # occasaionally print something so you know we're making progress
        if i % (1<<maxk) == 0:
            print(k, float(ix), prob)

    print('')
    print(k, maxix, maxprob)
    print('Sample size: 2^%d' % k)
    print('Mode: %f' % float(maxix))
    print('Probability mass at mode: %e' % float(maxprob))
    print('\n')
    return (float(maxix), float(maxprob))

# sample size (2^k), float for the mode, float for probability mass at mode
print([(k, findmode(k, maxk)) for k in range(maxk)])
